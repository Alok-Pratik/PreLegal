import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { MutualNdaFields, Party } from '@/types/nda';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#032147' },
  subtitle: { fontSize: 10, color: '#888888', marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8, color: '#032147' },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 160, fontWeight: 700 },
  value: { flex: 1 },
  partiesRow: { flexDirection: 'row', gap: 24, marginTop: 8 },
  partyColumn: { flex: 1 },
});

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

function PartyBlock({ label, party }: { label: string; party: Party }) {
  return (
    <View style={styles.partyColumn}>
      <Text style={{ fontWeight: 700, marginBottom: 4 }}>{label}</Text>
      <FieldRow label="Name" value={party.name} />
      <FieldRow label="Title" value={party.title} />
      <FieldRow label="Company" value={party.company} />
      <FieldRow label="Notice Address" value={party.notice_address} />
      <FieldRow label="Date" value={party.date} />
    </View>
  );
}

interface NDAPdfProps {
  fields: MutualNdaFields;
}

export function NDAPdf({ fields }: NDAPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.subtitle}>Common Paper Mutual NDA Standard Terms Version 1.0</Text>

        <Text style={styles.sectionTitle}>Cover Page</Text>
        <FieldRow label="Purpose" value={fields.purpose} />
        <FieldRow label="Effective Date" value={fields.effective_date} />
        <FieldRow label="MNDA Term" value={fields.mnda_term} />
        <FieldRow label="Term of Confidentiality" value={fields.confidentiality_term} />
        <FieldRow label="Governing Law" value={fields.governing_law} />
        <FieldRow label="Jurisdiction" value={fields.jurisdiction} />

        <View style={styles.partiesRow}>
          <PartyBlock label="Party 1" party={fields.party1} />
          <PartyBlock label="Party 2" party={fields.party2} />
        </View>
      </Page>
    </Document>
  );
}
