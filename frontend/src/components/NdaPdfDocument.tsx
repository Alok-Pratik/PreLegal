import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { NdaFormData } from "@/types/nda";
import { buildNdaClauses } from "@/lib/nda-content";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica" },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
  },
  heading: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  clause: { marginBottom: 12 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 48 },
  signatureBlock: { width: "45%" },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: "#333", marginBottom: 8 },
  signatureLabel: { color: "#555" },
});

export default function NdaPdfDocument({ data }: { data: NdaFormData }) {
  const clauses = buildNdaClauses(data);

  return (
    <Document title="Mutual Non-Disclosure Agreement">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        {clauses.map((clause) => (
          <View key={clause.heading} style={styles.clause}>
            <Text style={styles.heading}>{clause.heading}</Text>
            <Text>{clause.body}</Text>
          </View>
        ))}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text>{data.partyAName.trim() || "[Party A Name]"}</Text>
            <Text style={styles.signatureLabel}>Party A</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text>{data.partyBName.trim() || "[Party B Name]"}</Text>
            <Text style={styles.signatureLabel}>Party B</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
