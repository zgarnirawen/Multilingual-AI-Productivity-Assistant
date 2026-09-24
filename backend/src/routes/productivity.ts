import { Router } from "express";
import { agendaConnector, todoConnector } from "../connectors/index.js";
export const productivityRouter = Router();

productivityRouter.get("/todos", async (_req, res) => {
  try { res.json(await todoConnector.listTasks()); } catch (e) { console.error(e); res.status(502).json({ error: "Todo service unavailable" }); }
});
productivityRouter.post("/todos", async (req, res) => {
  if (typeof req.body?.title !== "string" || !req.body.title.trim()) return res.status(400).json({ error: "title is required" });
  try { res.status(201).json(await todoConnector.createTask(req.body)); } catch (e) { console.error(e); res.status(502).json({ error: "Todo service unavailable" }); }
});
productivityRouter.get("/todos/:id", async (req, res) => {
  try { const item = await todoConnector.getTask(req.params.id); if (!item) return res.status(404).json({ error: "Todo not found" }); res.json(item); } catch (e) { console.error(e); res.status(502).json({ error: "Todo service unavailable" }); }
});
productivityRouter.patch("/todos/:id", async (req, res) => {
  try { const item = await todoConnector.updateTask(req.params.id, req.body ?? {}); if (!item) return res.status(404).json({ error: "Todo not found" }); res.json(item); } catch (e) { console.error(e); res.status(502).json({ error: "Todo service unavailable" }); }
});
productivityRouter.delete("/todos/:id", async (req, res) => {
  try { if (!await todoConnector.deleteTask(req.params.id)) return res.status(404).json({ error: "Todo not found" }); res.status(204).send(); } catch (e) { console.error(e); res.status(502).json({ error: "Todo service unavailable" }); }
});

productivityRouter.get("/agenda/events", async (req, res) => {
  try { res.json(await agendaConnector.listEvents(typeof req.query.startDate === "string" ? req.query.startDate : undefined, typeof req.query.endDate === "string" ? req.query.endDate : undefined)); }
  catch (e) { console.error(e); res.status(502).json({ error: "Agenda service unavailable" }); }
});
productivityRouter.post("/agenda/events", async (req, res) => {
  if (typeof req.body?.title !== "string" || !req.body.title.trim()) return res.status(400).json({ error: "title is required" });
  if (typeof req.body?.dateTime !== "string" || !req.body.dateTime.trim()) return res.status(400).json({ error: "dateTime is required" });
  try { res.status(201).json(await agendaConnector.createEvent(req.body)); } catch (e) { console.error(e); res.status(502).json({ error: "Agenda service unavailable" }); }
});
productivityRouter.get("/agenda/events/:id", async (req, res) => {
  try { const item = await agendaConnector.getEvent(req.params.id); if (!item) return res.status(404).json({ error: "Agenda event not found" }); res.json(item); } catch (e) { console.error(e); res.status(502).json({ error: "Agenda service unavailable" }); }
});
productivityRouter.patch("/agenda/events/:id", async (req, res) => {
  try { const item = await agendaConnector.updateEvent(req.params.id, req.body ?? {}); if (!item) return res.status(404).json({ error: "Agenda event not found" }); res.json(item); } catch (e) { console.error(e); res.status(502).json({ error: "Agenda service unavailable" }); }
});
productivityRouter.delete("/agenda/events/:id", async (req, res) => {
  try { if (!await agendaConnector.deleteEvent(req.params.id)) return res.status(404).json({ error: "Agenda event not found" }); res.status(204).send(); } catch (e) { console.error(e); res.status(502).json({ error: "Agenda service unavailable" }); }
});
productivityRouter.get("/health", (_req, res) => res.json({ connectorMode: process.env.PRODUCTIVITY_CONNECTOR ?? "stub", status: "ok" }));
