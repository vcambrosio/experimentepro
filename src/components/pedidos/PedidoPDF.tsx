import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Pedido } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Thermal printer style (80mm = ~226 points at 72 DPI)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
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
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 3,
  },
  pedidoNumero: {
    fontSize: 14,
    fontWeight: 600,
    marginTop: 5,
  },
  dateTime: {
    fontSize: 10,
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
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  clientInfo: {
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: 600,
    width: 25,
  },
  itemName: {
    fontSize: 11,
    fontWeight: 600,
    flex: 1,
  },
  itemDescription: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 25,
    marginTop: 2,
  },
  itemDescriptionLine: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 25,
    marginTop: 1,
  },
  itemDetails: {
    fontSize: 9,
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
    fontSize: 10,
    color: '#666666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 3,
  },
  footer: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 9,
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
    fontSize: 13,
    fontWeight: 600,
  },
  totalValue: {
    fontSize: 15,
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
  // Validar dados do pedido
  const dataEntrega = pedido.data_hora_entrega ? new Date(pedido.data_hora_entrega) : new Date();
  const clienteNome = pedido.cliente?.nome || 'Cliente não informado';
  const setorNome = pedido.setor?.nome_setor || '';
  const itens = pedido.itens || [];
  const valorTotal = pedido.valor_total || 0;
  const status = pedido.status || 'pendente';

  return (
    <Document>
      <Page size={{ width: 226, height: 2000 }} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>{empresaNome}</Text>
          <Text style={styles.pedidoNumero}>PEDIDO DE EVENTO OU CESTA</Text>
          <Text style={styles.dateTime}>
            {format(dataEntrega, "dd/MM/yyyy 'às' HH:mm")}
          </Text>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <View style={styles.clientInfo}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{clienteNome}</Text>
          </View>
          {setorNome && (
            <View style={styles.clientInfo}>
              <Text style={styles.label}>Setor:</Text>
              <Text style={styles.value}>{setorNome}{pedido.setor?.responsavel ? ` (${pedido.setor.responsavel})` : ''}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Pedido de Evento ou Cesta</Text>
          
          {itens && itens.length > 0 ? itens.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemQty}>{item.quantidade || 0}x</Text>
                <Text style={styles.itemName}>{item.produto?.nome || 'Produto não informado'}</Text>
              </View>
              {item.descricao_customizada && (
                <View style={styles.itemDescription}>
                  {item.descricao_customizada.split('\n').map((linha, idx) => (
                    <Text key={idx} style={styles.itemDescriptionLine}>{linha}</Text>
                  ))}
                </View>
              )}
              {item.detalhes && (
                <Text style={styles.itemDetails}>
                  Obs: {item.detalhes}
                </Text>
              )}
            </View>
          )) : (
            <Text style={styles.value}>Nenhum item</Text>
          )}
        </View>

        <View style={styles.dividerDouble} />

        {/* Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Status do Pedido de Evento ou Cesta</Text>
          <Text style={styles.statusValue}>{getStatusLabel(status)}</Text>
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