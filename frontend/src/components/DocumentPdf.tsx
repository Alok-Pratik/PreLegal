import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { DocumentField } from '@/types/chat';
import { groupFields } from '@/utils/documentFields';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#032147' },
  groupTitle: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8, color: '#032147' },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 180, fontWeight: 700 },
  value: { flex: 1 },
});

function FieldRow({ field }: { field: DocumentField }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{field.label}</Text>
      <Text style={styles.value}>{field.value || '—'}</Text>
    </View>
  );
}

interface DocumentPdfProps {
  documentType: string;
  fields: DocumentField[];
}

export function DocumentPdf({ documentType, fields }: DocumentPdfProps) {
  const groups = groupFields(fields);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{documentType}</Text>

        {groups.map(([group, groupFields]) => (
          <View key={group || '__top_level__'}>
            {group && <Text style={styles.groupTitle}>{group}</Text>}
            {groupFields.map((field) => (
              <FieldRow key={field.key} field={field} />
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
