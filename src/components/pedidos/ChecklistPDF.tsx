import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Pedido, ChecklistItem } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 13,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C42',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#FF8C42',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333333',
  },
  dateInfo: {
    fontSize: 13,
    color: '#666666',
    marginTop: 5,
  },
  clientSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  clientLabel: {
    fontSize: 12,
    color: '#666666',
  },
  clientValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333333',
  },
  productSection: {
    marginBottom: 15,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333333',
    backgroundColor: '#FFE5B4',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 2,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#A8D5BA',
    borderColor: '#6FB88A',
  },
  checkmark: {
    fontSize: 13,
    color: '#2D5F3F',
    textAlign: 'center',
  },
  itemText: {
    fontSize: 13,
    color: '#333333',
    flex: 1,
  },
  itemTextChecked: {
    textDecoration: 'line-through',
    color: '#999999',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
});

interface ChecklistPDFProps {
  pedido: Pedido;
  checklistData: { produtoNome: string; produtoId: string; quantidade: number; itens: (ChecklistItem & { quantidadeTotal: number })[] }[];
  checkedItems: Record<string, boolean>;
  empresaNome?: string;
}

export function ChecklistPDF({ 
  pedido, 
  checklistData, 
  checkedItems,
  empresaNome = 'Experimente Pro',
}: ChecklistPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CHECKLIST DE PRODUÇÃO</Text>
          <Text style={styles.subtitle}>{empresaNome}</Text>
          <Text style={styles.dateInfo}>
            Pedido para: {format(new Date(pedido.data_hora_entrega), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <Text style={styles.clientLabel}>Cliente:</Text>
          <Text style={styles.clientValue}>{pedido.cliente?.nome}</Text>
          {pedido.setor && (
            <>
              <Text style={[styles.clientLabel, { marginTop: 5 }]}>Setor:</Text>
              <Text style={styles.clientValue}>{pedido.setor.nome_setor}</Text>
            </>
          )}
        </View>

        {/* Checklist Items by Product */}
        {checklistData.map((produto, produtoIndex) => (
          <View key={produtoIndex} style={styles.productSection}>
            <Text style={styles.productTitle}>{produto.produtoNome} (x{produto.quantidade})</Text>
            
            {produto.itens.map((item) => {
              const isChecked = checkedItems[item.id] || false;
              
              return (
                <View key={item.id} style={styles.checklistItem}>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemText, isChecked && styles.itemTextChecked]}>
                    {item.quantidadeTotal}x {item.descricao}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</Text>
          <Text>{empresaNome} - Sistema de Gestão</Text>
        </View>
      </Page>
    </Document>
  );
}