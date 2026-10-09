
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: "A valid supplement ID is required" });
  }

  try {
    const response = await fetch(
      `https://dsld-dev-api.app.cloud.gov/api/v9/label/${id}`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Unable to retrieve supplement details",
      });
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("DSLD product details error:", error);

    return res.status(500).json({
      error: "Something went wrong while retrieving supplement details",
    });
  }
}
