import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { Orcamento } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
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
  fixedHeader: {
    // Header fixo que se repete em cada página
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: '#FF8C42',
    marginBottom: 5,
    objectFit: 'contain' as const,
  },
  logoContainer: {
    position: 'absolute' as const,
    top: 40,
    right: 40,
    width: 80,
    height: 80,
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
  productCol: { width: '65%' },
  qtyCol: { width: '10%', textAlign: 'center' as const },
  unitCol: { width: '12.5%', textAlign: 'right' as const },
  totalCol: { width: '12.5%', textAlign: 'right' as const },
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
  empresaLogoUrl?: string;
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

const Header = ({ orcamento, empresaTelefone, empresaEmail, empresaEndereco, empresaLogoUrl }: OrcamentoPDFProps) => (
  <View style={styles.fixedHeader}>
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Logo da empresa no canto superior esquerdo */}
        {empresaLogoUrl && (
          <View style={{ marginRight: 20 }}>
            <Image src={empresaLogoUrl} style={{ width: 120, height: 80, objectFit: 'contain' as const }} />
          </View>
        )}
         
        {/* Informações da empresa e título do orçamento */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {empresaTelefone && <Text style={styles.companyInfo}>{empresaTelefone}</Text>}
          {empresaEmail && <Text style={styles.companyInfo}>{empresaEmail}</Text>}
          {empresaEndereco && <Text style={styles.companyInfo}>{empresaEndereco}</Text>}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.title}>ORÇAMENTO</Text>
            <Text style={styles.subtitle}>{orcamento.numero_orcamento}</Text>
            {orcamento.validade && (
              <View style={styles.badgeRow}>
                <View style={styles.validityBadge}>
                  <Text>Válido até: {format(new Date(orcamento.validade), 'dd/MM/yyyy')}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  </View>
);

export function OrcamentoPDF({
  orcamento,
  empresaNome = 'Experimente Pro',
  empresaTelefone,
  empresaEmail,
  empresaEndereco,
  empresaLogoUrl,
}: OrcamentoPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Fixo - Repete em cada página */}
        <View fixed>
          <Header
            orcamento={orcamento}
            empresaTelefone={empresaTelefone}
            empresaEmail={empresaEmail}
            empresaEndereco={empresaEndereco}
            empresaLogoUrl={empresaLogoUrl}
          />
        </View>

        {/* Espaço mínimo para o header fixo */}
        <View style={{ height: 10 }} />

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
              {orcamento.setor.responsavel && (
                <Text style={styles.value}> ({orcamento.setor.responsavel})</Text>
              )}
              {orcamento.setor.contato && (
                <Text style={styles.value}> - {orcamento.setor.contato}</Text>
              )}
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
          {(orcamento.data_entrega || orcamento.hora_entrega) && (
            <View style={styles.row}>
              <Text style={styles.label}>Data de Entrega:</Text>
              <Text style={styles.value}>
                {orcamento.data_entrega && format(new Date(orcamento.data_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {orcamento.data_entrega && orcamento.hora_entrega && ' às '}
                {orcamento.hora_entrega}
              </Text>
            </View>
          )}
        </View>

        {/* Descrição do Orçamento */}
        {orcamento.descricao && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.conditionsText}>{orcamento.descricao}</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.section}>
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
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total do Orçamento:</Text>
            <Text style={styles.totalValue}>{formatCurrency(orcamento.valor_total)}</Text>
          </View>
        </View>

        {/* Espaço vazio para separar do Total */}
        <View style={{ height: 30 }} />

        {/* Conditions */}
        {orcamento.condicoes_comerciais && (
          <View style={styles.conditions}>
            <Text style={styles.conditionsTitle}>Condições Comerciais</Text>
            <Text style={styles.conditionsText}>{orcamento.condicoes_comerciais}</Text>
          </View>
        )}

        {/* Data do Orçamento */}
        <View style={[styles.section, { textAlign: 'center' as const }]}>
          <Text style={{ fontSize: 10, color: '#333333', marginBottom: 5, textAlign: 'center' as const }}>
            Campo Largo, {format(new Date(orcamento.data_orcamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
          <Text style={{ fontSize: 10, color: '#333333', textAlign: 'center' as const }}>
            Comercial Experimente
          </Text>
        </View>

        {/* Footer Fixo - Repete em cada página */}
        <View fixed style={styles.footer}>
          <Text>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</Text>
          <Text>Experimente Pro - Sistema de Gestão - digitalhub.app.br</Text>
        </View>
      </Page>
    </Document>
  );
}
