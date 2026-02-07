import {
  getGlobalSettings,
  saveGlobalSettings,
} from "../../../lib/cms/store";

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json(getGlobalSettings());
    }

    if (req.method === "PUT") {
      const current = getGlobalSettings();
      const payload = req.body || {};
      const next = {
        ...current,
        data: {
          ...current.data,
          ...(payload.data || {}),
        },
        updatedAt: new Date().toISOString(),
      };
      saveGlobalSettings(next);
      return res.status(200).json(next);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
