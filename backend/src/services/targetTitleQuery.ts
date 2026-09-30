/** Strip generic task/item wrappers from an extracted title query. */
export function normalizeTargetTitleQuery(value: string): string | undefined {
  let query = value.trim().replace(/\s+/g, " ");
  const genericPrefixes = [
    /^(?:la|le|les|l')?\s*(?:tâche|tache|rappel|élément|element)\s+(?:concernant|à propos de|au sujet de|sur|pour)\s+/i,
    /^(?:the\s+)?(?:task|reminder|item)\s+(?:about|concerning|regarding|for)\s+/i,
    /^(?:la|le|les|l')\s+/i,
    /^the\s+/i,
  ];
  let previous: string;
  do {
    previous = query;
    for (const prefix of genericPrefixes) query = query.replace(prefix, "").trim();
  } while (query !== previous);
  return query || undefined;
}
