// Phase 9: short, calibrated copy explaining what a Lens Match
// confidence score actually means — deliberately never phrased as
// certainty ("we found your item"). AI similarity is a strong signal,
// not a verified identification, so every tier ends by asking the
// people involved to confirm details themselves before assuming a match.
export function getConfidenceExplanation(score: number): string {
  if (score >= 85) {
    return 'This means the uploaded images appear highly similar. Please verify the details before arranging collection.'
  }
  if (score >= 60) {
    return "This appears to be a strong potential match. Please confirm the details together before assuming it's the same item."
  }
  return 'The AI found some visual similarity, but confidence is lower here — double-check the details carefully before reaching out.'
}
