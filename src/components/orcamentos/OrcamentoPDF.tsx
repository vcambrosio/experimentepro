import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Orcamento } from '@/types';
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

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C42',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: '#FF8C42',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666666',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#333333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#333333',
    marginBottom: 10,
    backgroundColor: '#F5E6D3',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontSize: 9,
    color: '#666666',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#333333',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF8C42',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 9,
    color: '#333333',
  },
  productCol: { width: '40%' },
  qtyCol: { width: '10%', textAlign: 'center' as const },
  unitCol: { width: '25%', textAlign: 'right' as const },
  totalCol: { width: '25%', textAlign: 'right' as const },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666666',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#FF8C42',
  },
  conditions: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  conditionsTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#333333',
    marginBottom: 8,
  },
  conditionsText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
  validityBadge: {
    backgroundColor: '#FFB380',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 8,
    color: '#333333',
    alignSelf: 'flex-start',
  },
  statusBadge: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 8,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
});

interface OrcamentoPDFProps {
  orcamento: Orcamento;
  empresaNome?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaEndereco?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'aprovado': return '#A8D5A2';
    case 'recusado': return '#FFB3BA';
    case 'expirado': return '#E0E0E0';
    default: return '#FFE5B4';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'aprovado': return 'APROVADO';
    case 'recusado': return 'RECUSADO';
    case 'expirado': return 'EXPIRADO';
    default: return 'PENDENTE';
  }
};

export function OrcamentoPDF({ 
  orcamento, 
  empresaNome = 'Experimente Pro',
  empresaTelefone,
  empresaEmail,
  empresaEndereco,
}: OrcamentoPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.logo}>{empresaNome}</Text>
              {empresaTelefone && <Text style={styles.companyInfo}>{empresaTelefone}</Text>}
              {empresaEmail && <Text style={styles.companyInfo}>{empresaEmail}</Text>}
              {empresaEndereco && <Text style={styles.companyInfo}>{empresaEndereco}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.title}>ORÇAMENTO</Text>
              <Text style={styles.subtitle}>{orcamento.numero_orcamento}</Text>
              <View style={styles.badgeRow}>
                {orcamento.validade && (
                  <View style={styles.validityBadge}>
                    <Text>Válido até: {format(new Date(orcamento.validade), 'dd/MM/yyyy')}</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orcamento.status) }]}>
                  <Text>{getStatusLabel(orcamento.status)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{orcamento.cliente?.nome}</Text>
          </View>
          {orcamento.cliente?.cpf_cnpj && (
            <View style={styles.row}>
              <Text style={styles.label}>
                {orcamento.cliente.tipo_pessoa === 'juridica' ? 'CNPJ:' : 'CPF:'}
              </Text>
              <Text style={styles.value}>{orcamento.cliente.cpf_cnpj}</Text>
            </View>
          )}
          {orcamento.setor && (
            <View style={styles.row}>
              <Text style={styles.label}>Setor:</Text>
              <Text style={styles.value}>{orcamento.setor.nome_setor}</Text>
            </View>
          )}
          {orcamento.cliente?.telefone && (
            <View style={styles.row}>
              <Text style={styles.label}>Telefone:</Text>
              <Text style={styles.value}>{orcamento.cliente.telefone}</Text>
            </View>
          )}
          {orcamento.cliente?.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{orcamento.cliente.email}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Data do Orçamento:</Text>
            <Text style={styles.value}>
              {format(new Date(orcamento.data_orcamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Orçamento</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.productCol]}>Produto/Serviço</Text>
              <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Qtd</Text>
              <Text style={[styles.tableHeaderCell, styles.unitCol]}>Valor Unit.</Text>
              <Text style={[styles.tableHeaderCell, styles.totalCol]}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {orcamento.itens?.map((item, index) => (
              <View 
                key={item.id} 
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
              >
                <View style={styles.productCol}>
                  <Text style={styles.tableCell}>{item.produto?.nome}</Text>
                  {item.descricao_customizada && (
                    <Text style={[styles.tableCell, { fontSize: 8, color: '#888888', marginTop: 2 }]}>
                      {item.descricao_customizada}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.qtyCol]}>{item.quantidade}</Text>
                <Text style={[styles.tableCell, styles.unitCol]}>{formatCurrency(item.valor_unitario)}</Text>
                <Text style={[styles.tableCell, styles.totalCol]}>{formatCurrency(item.valor_total)}</Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total do Orçamento:</Text>
              <Text style={styles.totalValue}>{formatCurrency(orcamento.valor_total)}</Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        {orcamento.condicoes_comerciais && (
          <View style={styles.conditions}>
            <Text style={styles.conditionsTitle}>Condições Comerciais</Text>
            <Text style={styles.conditionsText}>{orcamento.condicoes_comerciais}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</Text>
          <Text>{empresaNome} - Sistema de Gestão</Text>
        </View>
      </Page>
    </Document>
  );
}