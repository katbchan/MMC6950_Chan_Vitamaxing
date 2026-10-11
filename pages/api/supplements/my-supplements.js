
import { withIronSessionApiRoute } from "iron-session/next";
import { Types } from "mongoose";
import sessionOptions from "../../../config/session";
import dbConnect from "../../../db/connection";
import User from "../../../db/models/user";

export default withIronSessionApiRoute(
  async function handler(req, res) {
    // Require the user to be logged in.
    if (!req.session.user) {
      return res.status(401).json({
        error: "Please log in first.",
      });
    }

    // Only allow POST (add), DELETE (remove), and PATCH (move).
    if (!["POST", "DELETE", "PATCH"].includes(req.method)) {
      res.setHeader("Allow", ["POST", "DELETE", "PATCH"]);
      return res.status(405).json({
        error: "Method not allowed.",
      });
    }

    const { dsldId } = req.body;

    if (!dsldId || !/^\d+$/.test(String(dsldId))) {
      return res.status(400).json({
        error: "A valid supplement ID is required.",
      });
    }

    try {
      await dbConnect();

      const userId = req.session.user._id;

      if (!Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          error: "Invalid user session. Please log in again.",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "User account not found.",
        });
      }

      const id = String(dsldId);

      // REMOVE: Delete the supplement from the user's list.
      if (req.method === "DELETE") {
        const existingCount = user.supplements.length;

        user.supplements = user.supplements.filter(
          (supplement) => supplement.dsldId !== id
        );

        if (user.supplements.length === existingCount) {
          return res.status(404).json({
            error: "Supplement not found in your list.",
          });
        }

        await user.save();

        return res.status(200).json({
          message: "Supplement removed successfully.",
        });
      }

      // MOVE: Change the supplement's status.
      if (req.method === "PATCH") {
        const { status } = req.body;

        if (!["current", "saved"].includes(status)) {
          return res.status(400).json({
            error: "Status must be current or saved.",
          });
        }

        const supplement = user.supplements.find(
          (item) => item.dsldId === id
        );

        if (!supplement) {
          return res.status(404).json({
            error: "Supplement not found in your list.",
          });
        }

        supplement.status = status;
        await user.save();

        return res.status(200).json({
          message: "Supplement moved successfully.",
          status,
        });
      }

      // ADD: Prevent duplicate supplements.
      if (
        user.supplements.some(
          (supplement) => supplement.dsldId === id
        )
      ) {
        return res.status(409).json({
          error: "This supplement is already in your list.",
        });
      }

      // Retrieve the supplement details from DSLD.
      const response = await fetch(
        `https://dsld-dev-api.app.cloud.gov/api/v9/label/${id}`
      );

      if (!response.ok) {
        return res.status(502).json({
          error: "Unable to retrieve supplement information.",
        });
      }

      const data = await response.json();
      const serving = data.servingSizes?.[0];

      const ingredients = (data.ingredientRows || []).map(
        (ingredient) => {
          const quantity = ingredient.quantity?.[0];

          return {
            name: ingredient.name,
            ingredientId: String(
              ingredient.ingredientId || ""
            ),
            quantity:
              typeof quantity?.quantity === "number"
                ? quantity.quantity
                : null,
            unit: quantity?.unit || "",
          };
        }
      );

      user.supplements.push({
        dsldId: id,
        fullName: data.fullName || "Unnamed supplement",
        brandName: data.brandName || "",
        form:
          data.physicalState?.langualCodeDescription || "",
        servingSize: serving
          ? `${serving.minQuantity}${
              serving.unit ? ` ${serving.unit}` : ""
            }${
              serving.notes ? ` (${serving.notes})` : ""
            }`
          : "",
        status: req.body.status === "saved" ? "saved" : "current",
        ingredients,
        otherIngredients: (
          data.otheringredients?.ingredients || []
        ).map((ingredient) => ingredient.name),
      });

      await user.save();

      return res.status(201).json({
        message: "Supplement added successfully.",
      });
    } catch (error) {
      console.error("Supplement list error:", error);

      return res.status(500).json({
        error: "Unable to update your supplement list.",
      });
    }
  },
  sessionOptions
);
