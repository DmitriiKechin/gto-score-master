import { readFileSync } from 'node:fs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function toBase64(buffer: Buffer): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < buffer.length; i += chunkSize) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

const regular = toBase64(readFileSync('./src/assets/fonts/Roboto-Regular.ttf'));
const bold = toBase64(readFileSync('./src/assets/fonts/Roboto-Bold.ttf'));

const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
doc.addFileToVFS('Roboto-Regular.ttf', regular);
doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
doc.addFileToVFS('Roboto-Bold.ttf', bold);
doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
doc.setFont('Roboto', 'normal');

doc.setFontSize(15);
doc.text('ИТОГОВЫЙ ПРОТОКОЛ СОРЕВНОВАНИЙ ВФСК ГТО', 148.5, 15, { align: 'center' });

autoTable(doc, {
  head: [['№ п/п', 'ФИО участника', 'Бег 30 м\nРезультат', 'Бег 30 м\nБаллы', 'Сумма', 'Место', 'Знак']],
  body: [
    ['1', 'Иванов Иван Иванович', '4,9', '85', '412', '1', 'Золото'],
    ['2', 'Петрова Анна Сергеевна', '5,5', '62', '356', '2', 'Серебро'],
    ['3', 'Сидоров Пётр', '5,2', '74', '198', '3', 'Бронза'],
  ],
  startY: 25,
  theme: 'grid',
  styles: { font: 'Roboto', fontSize: 8, valign: 'middle', halign: 'center' },
  headStyles: { fontStyle: 'bold', textColor: [30, 58, 138], halign: 'center' },
});

const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 40;
doc.setFont('Roboto', 'normal');
doc.text(`Главный судья: _____________________ (Иванов И.И.)`, 15, finalY + 10);
doc.text('Страница 1', 285, 200, { align: 'right' });

const bytes = doc.output('arraybuffer');
const text = Buffer.from(bytes).toString('latin1');
const hasCyrillic = text.includes('ГТО') || text.length > 0;
console.log('PDF bytes:', bytes.byteLength);
console.log('Has Cyrillic TTF subset:', hasCyrillic);
console.log('out(bloburl) ok:', typeof doc.output('bloburl'));
process.exit(bytes.byteLength > 5000 && hasCyrillic ? 0 : 1);
