import { format } from 'date-fns';
import { Pedido, ChecklistItem } from '@/types';

interface ChecklistThermalPrintProps {
  pedido: Pedido;
  checklistData: { produtoNome: string; produtoId: string; quantidade: number; itens: (ChecklistItem & { quantidadeTotal: number })[] }[];
  checkedItems: Record<string, boolean>;
  empresaNome?: string;
}

export function useChecklistThermalPrint() {
  const print = (props: ChecklistThermalPrintProps) => {
    const { pedido, checklistData, checkedItems, empresaNome = 'Experimente Pro' } = props;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Checklist - ${format(new Date(pedido.data_hora_entrega), 'dd/MM/yyyy HH:mm')}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial Black', 'Arial', sans-serif;
      font-size: 16px;
      font-weight: 900;
      width: 80mm;
      padding: 3mm;
      background: white;
      color: black;
    }
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .logo {
      font-size: 20px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .title {
      font-size: 18px;
      font-weight: 900;
      margin-top: 4px;
    }
    .datetime {
      font-size: 14px;
      font-weight: 700;
      color: #333;
      margin-top: 2px;
    }
    .divider {
      border-bottom: 1px dashed #000;
      margin: 6px 0;
    }
    .divider-double {
      border-bottom: 2px solid #000;
      margin: 6px 0;
    }
    .section {
      margin-bottom: 6px;
    }
    .section-title {
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 3px;
      font-size: 15px;
    }
    .label {
      font-size: 14px;
      font-weight: 700;
      color: #666;
    }
    .value {
      font-weight: 900;
    }
    .product-section {
      margin-bottom: 8px;
      border-bottom: 1px dotted #ccc;
      padding-bottom: 4px;
    }
    .product-header {
      font-weight: 900;
      font-size: 15px;
      margin-bottom: 3px;
    }
    .product-qty {
      font-weight: 700;
      color: #666;
      font-size: 14px;
    }
    .checklist-item {
      margin-bottom: 4px;
      padding-left: 4px;
    }
    .checkbox {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1px solid #000;
      margin-right: 4px;
      vertical-align: middle;
    }
    .checkbox.checked {
      background: #000;
    }
    .item-qty {
      font-weight: 900;
      margin-right: 2px;
    }
    .item-desc {
      display: inline-block;
      vertical-align: middle;
      font-size: 15px;
      font-weight: 700;
    }
    .item-desc.checked {
      text-decoration: line-through;
      color: #999;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #999;
      border-top: 1px dashed #000;
      padding-top: 4px;
    }
    @media print {
      body {
        width: 80mm;
      }
    }
  </style>
</head>
<body style="width: 80mm; overflow: visible; height: auto;">
  <div class="content-wrapper">
    <div class="header">
      <div class="logo">${empresaNome}</div>
      <div class="title">CHECKLIST PRODUÇÃO</div>
      <div class="datetime">${format(new Date(pedido.data_hora_entrega), "dd/MM/yyyy 'às' HH:mm")}</div>
    </div>

    <div class="section">
      <div><span class="label">Cliente:</span></div>
      <div class="value">${pedido.cliente?.nome || '-'}</div>
      ${pedido.setor ? `
      <div style="margin-top: 2px;"><span class="label">Setor:</span></div>
      <div class="value">${pedido.setor.nome_setor}${pedido.setor.responsavel ? ` (${pedido.setor.responsavel})` : ''}</div>
      ` : ''}
    </div>

    <div class="divider"></div>

    <div class="section">
      ${checklistData.map(produto => `
        <div class="product-section">
          <div class="product-header">
            ${produto.produtoNome}
            <span class="product-qty"> (x${produto.quantidade})</span>
          </div>
          ${produto.itens.map(item => {
            const isChecked = checkedItems[item.id] || false;
            return `
              <div class="checklist-item">
                <span class="checkbox ${isChecked ? 'checked' : ''}">${isChecked ? '✓' : ''}</span>
                <span class="item-qty">${item.quantidadeTotal}x</span>
                <span class="item-desc ${isChecked ? 'checked' : ''}">${item.descricao}</span>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>

    <div class="divider-double"></div>

    <div class="footer">
      Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
      <br>
      ${empresaNome} - Sistema de Gestão
    </div>
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
