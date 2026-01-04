import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Pedido } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Register Inter font
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

// Thermal printer style (80mm = ~226 points at 72 DPI)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    padding: 15,
    backgroundColor: '#ffffff',
    width: 226,
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    borderBottomStyle: 'dashed',
  },
  logo: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 3,
  },
  pedidoNumero: {
    fontSize: 11,
    fontWeight: 600,
    marginTop: 5,
  },
  dateTime: {
    fontSize: 8,
    color: '#666666',
    marginTop: 3,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    borderBottomStyle: 'dashed',
    marginVertical: 8,
  },
  dividerDouble: {
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
    marginVertical: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 600,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  clientInfo: {
    marginBottom: 3,
  },
  label: {
    fontSize: 8,
    color: '#666666',
  },
  value: {
    fontSize: 9,
    fontWeight: 500,
  },
  itemRow: {
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 9,
    fontWeight: 600,
    width: 25,
  },
  itemName: {
    fontSize: 9,
    fontWeight: 600,
    flex: 1,
  },
  itemDescription: {
    fontSize: 8,
    color: '#666666',
    marginLeft: 25,
    marginTop: 2,
  },
  itemDetails: {
    fontSize: 7,
    color: '#888888',
    marginLeft: 25,
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusSection: {
    textAlign: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 8,
    color: '#666666',
  },
  statusValue: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 3,
  },
  footer: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 7,
    color: '#999999',
  },
  totalSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#333333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 600,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 700,
  },
});

interface PedidoPDFProps {
  pedido: Pedido;
  empresaNome?: string;
  showValues?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'executado': return 'EXECUTADO';
    case 'cancelado': return 'CANCELADO';
    default: return 'PENDENTE';
  }
};

export function PedidoPDF({ 
  pedido, 
  empresaNome = 'Experimente Pro',
  showValues = false,
}: PedidoPDFProps) {
  return (
    <Document>
      <Page size={[226, 'auto']} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>{empresaNome}</Text>
          <Text style={styles.pedidoNumero}>PEDIDO</Text>
          <Text style={styles.dateTime}>
            {format(new Date(pedido.data_hora_entrega), "dd/MM/yyyy 'às' HH:mm")}
          </Text>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <View style={styles.clientInfo}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{pedido.cliente?.nome}</Text>
          </View>
          {pedido.setor && (
            <View style={styles.clientInfo}>
              <Text style={styles.label}>Setor:</Text>
              <Text style={styles.value}>{pedido.setor.nome_setor}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          
          {pedido.itens?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemQty}>{item.quantidade}x</Text>
                <Text style={styles.itemName}>{item.produto?.nome}</Text>
              </View>
              {item.descricao_customizada && (
                <Text style={styles.itemDescription}>
                  {item.descricao_customizada}
                </Text>
              )}
              {item.detalhes && (
                <Text style={styles.itemDetails}>
                  Obs: {item.detalhes}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Total (only for admin) */}
        {showValues && (
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL:</Text>
              <Text style={styles.totalValue}>{formatCurrency(pedido.valor_total)}</Text>
            </View>
          </View>
        )}

        <View style={styles.dividerDouble} />

        {/* Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Status do Pedido</Text>
          <Text style={styles.statusValue}>{getStatusLabel(pedido.status)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</Text>
          <Text>{empresaNome}</Text>
        </View>
      </Page>
    </Document>
  );
}