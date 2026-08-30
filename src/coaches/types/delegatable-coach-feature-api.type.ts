/** Coach customizable feature row returned on GET /coaches (joined catalog + flag state). */
export interface DelegatableCoachFeatureApi {
  id: number;
  status: string;
  parentId: number | null;
  titleKey: string;
  descriptionKey: string;
}
