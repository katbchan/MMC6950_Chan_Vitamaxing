export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Search term is required" });
  }

  try {
    const response = await fetch(
      `https://dsld-dev-api.app.cloud.gov/api/v9/browse-products/?method=by_keyword&q=${encodeURIComponent(q)}`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Unable to retrieve supplement data",
      });
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error("DSLD API error:", error);

    res.status(500).json({
      error: "Something went wrong while searching for supplements",
    });
  }
}