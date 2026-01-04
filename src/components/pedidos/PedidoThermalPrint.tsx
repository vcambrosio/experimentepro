import { useRef } from 'react';
import { format } from 'date-fns';
import { Pedido } from '@/types';

interface PedidoThermalPrintProps {
  pedido: Pedido;
  empresaNome?: string;
  showValues?: boolean;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'executado': return 'EXECUTADO';
    case 'cancelado': return 'CANCELADO';
    default: return 'PENDENTE';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function useThermalPrint() {
  const printRef = useRef<HTMLDivElement>(null);

  const print = (pedido: Pedido, empresaNome?: string, showValues?: boolean) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pedido - ${format(new Date(pedido.data_hora_entrega), 'dd/MM/yyyy HH:mm')}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 15px;
      width: 80mm;
      padding: 5mm;
      background: white;
      color: black;
    }
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .logo {
      font-size: 20px;
      font-weight: bold;
    }
    .pedido-num {
      font-size: 18px;
      font-weight: bold;
      margin-top: 4px;
    }
    .datetime {
      font-size: 13px;
      color: #333;
      margin-top: 4px;
    }
    .divider {
      border-bottom: 1px dashed #000;
      margin: 8px 0;
    }
    .divider-double {
      border-bottom: 2px solid #000;
      margin: 8px 0;
    }
    .section {
      margin-bottom: 8px;
    }
    .section-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .label {
      font-size: 13px;
      color: #666;
    }
    .value {
      font-weight: bold;
    }
    .item {
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px dotted #ccc;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
    }
    .item-qty {
      font-weight: bold;
      width: 30px;
    }
    .item-name {
      font-weight: bold;
      flex: 1;
    }
    .item-desc {
      font-size: 13px;
      color: #666;
      margin-left: 30px;
      margin-top: 2px;
    }
    .item-obs {
      font-size: 12px;
      color: #888;
      margin-left: 30px;
      font-style: italic;
    }
    .status-box {
      text-align: center;
      background: #f0f0f0;
      padding: 8px;
      margin-top: 8px;
      border-radius: 4px;
    }
    .status-label {
      font-size: 13px;
      color: #666;
    }
    .status-value {
      font-size: 18px;
      font-weight: bold;
      margin-top: 2px;
    }
    .total-section {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid #000;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label {
      font-size: 15px;
      font-weight: bold;
    }
    .total-value {
      font-size: 18px;
      font-weight: bold;
    }
    .footer {
      margin-top: 12px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    @media print {
      body {
        width: 80mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${empresaNome || 'Experimente Pro'}</div>
    <div class="pedido-num">PEDIDO</div>
    <div class="datetime">${format(new Date(pedido.data_hora_entrega), "dd/MM/yyyy 'às' HH:mm")}</div>
  </div>

  <div class="section">
    <div><span class="label">Cliente:</span></div>
    <div class="value">${pedido.cliente?.nome || '-'}</div>
    ${pedido.setor ? `
    <div style="margin-top: 4px;"><span class="label">Setor:</span></div>
    <div class="value">${pedido.setor.nome_setor}</div>
    ` : ''}
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-title">Itens do Pedido</div>
    ${(pedido.itens || []).map(item => `
      <div class="item">
        <div class="item-header">
          <span class="item-qty">${item.quantidade}x</span>
          <span class="item-name">${item.produto?.nome || '-'}</span>
        </div>
        ${item.descricao_customizada ? `<div class="item-desc">${item.descricao_customizada}</div>` : ''}
        ${item.detalhes ? `<div class="item-obs">Obs: ${item.detalhes}</div>` : ''}
      </div>
    `).join('')}
  </div>

  <div class="divider-double"></div>

  <div class="status-box">
    <div class="status-label">Status do Pedido</div>
    <div class="status-value">${getStatusLabel(pedido.status)}</div>
  </div>

  <div class="footer">
    <div>Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</div>
    <div>${empresaNome || 'Experimente Pro'}</div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  return { print };
}
