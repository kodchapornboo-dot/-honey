function doGet(e) {
  const sheet = SpreadsheetApp.openById('1dYi28uKYCcPMkNjp9pii32_Z9Op2Rq11eCcQR4ImqyU').getSheetByName('Orders') || createOrdersSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonOutput({ orders: [] });

  const headers = values.shift();
  const orders = values.map(row => {
    const data = {};
    headers.forEach((header, index) => data[header] = row[index]);
    let items = [];
    try { items = JSON.parse(data.items || '[]'); } catch (_) {}
    let customer = {};
    try { customer = JSON.parse(data.customer || '{}'); } catch (_) {}
    return { id:data.id, customer, items, total:Number(data.total || 0), status:data.status || 'รอแพ็ก', createdAt:data.createdAt };
  });
  return jsonOutput({ orders: orders.reverse() });
}

function doPost(e) {
  const sheet = SpreadsheetApp.openById('1dYi28uKYCcPMkNjp9pii32_Z9Op2Rq11eCcQR4ImqyU').getSheetByName('Orders') || createOrdersSheet();
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (_) { return jsonOutput({ success:false }); }

  if (body.action === 'updateStatus') {
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === String(body.id)) {
        sheet.getRange(i + 1, 8).setValue(body.status);
        sheet.getRange(i + 1, 9).setValue(new Date());
        return jsonOutput({ success:true });
      }
    }
    return jsonOutput({ success:false, message:'ไม่พบออเดอร์' });
  }

  sheet.appendRow([
    body.id,
    body.customer && body.customer.name || '',
    body.customer && body.customer.phone || '',
    body.customer && body.customer.address || '',
    body.customer && body.customer.note || '',
    JSON.stringify(body.items || []),
    Number(body.total || 0),
    body.status || 'รอแพ็ก',
    new Date(body.createdAt || new Date())
  ]);
  return jsonOutput({ success:true, id:body.id });
}

function createOrdersSheet() {
  const ss = SpreadsheetApp.openById('1dYi28uKYCcPMkNjp9pii32_Z9Op2Rq11eCcQR4ImqyU');
  const sheet = ss.insertSheet('Orders');
  sheet.appendRow(['id','name','phone','address','note','items','total','status','createdAt','customer']);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,10).setFontWeight('bold');
  return sheet;
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
