export interface NdaFormData {
  partyAName: string;
  partyAAddress: string;
  partyBName: string;
  partyBAddress: string;
  effectiveDate: string;
  purpose: string;
  termYears: string;
  governingLaw: string;
}

export const emptyNdaFormData: NdaFormData = {
  partyAName: "",
  partyAAddress: "",
  partyBName: "",
  partyBAddress: "",
  effectiveDate: "",
  purpose: "",
  termYears: "2",
  governingLaw: "",
};
