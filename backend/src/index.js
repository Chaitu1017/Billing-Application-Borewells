const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const db = require('./db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Storage setup (kept for compatibility, though signatures removed from UI)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Register handlebars helpers
handlebars.registerHelper('repeat', function(n, block) {
    let accum = '';
    for(let i = 0; i < n; ++i)
        accum += block.fn(i);
    return accum;
});
handlebars.registerHelper('minus', function(a, b) {
    return a - b;
});
handlebars.registerHelper('gt', function(a, b) {
    return a > b;
});

// Routes
app.post('/api/invoices-batch', upload.any(), async (req, res) => {
    try {
        const { invoicesMetadata } = req.body;
        const invoices = JSON.parse(invoicesMetadata);
        
        // Filter out empty invoices before saving to DB
        const validInvoices = invoices.filter(inv => 
            inv.customerName?.trim() || 
            inv.items.some(it => it.description?.trim() && parseFloat(it.quantity) > 0)
        );

        if (validInvoices.length === 0) {
            return res.status(400).json({ error: "No valid data to save" });
        }

        const stmt = db.prepare(`
            INSERT INTO invoices (
                invoice_number, date, customer_name, customer_address, month_year, 
                items, taxable_value, sgst, cgst, igst, round_off, grand_total, 
                chairman_signature, customer_signature
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = db.transaction((invs) => {
            for (let inv of invs) {
                stmt.run(
                    inv.invoiceNumber, inv.date, inv.customerName, inv.customerAddress, inv.monthYear, 
                    JSON.stringify(inv.items.filter(it => it.description)), 
                    inv.taxSection.taxableValue, inv.taxSection.sgst, inv.taxSection.cgst, 
                    inv.taxSection.igst, inv.taxSection.roundOff, inv.taxSection.grandTotal,
                    null, null
                );
            }
        });

        insertMany(validInvoices);
        res.status(201).json({ message: 'Batch saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/invoices', (req, res) => {
    const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
    res.json(invoices);
});

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { invoices } = req.body;
        
        // ONLY generate PDF for invoices with data
        const validInvoices = invoices.filter(inv => 
            inv.customerName?.trim() || 
            inv.items.some(it => it.description?.trim() && parseFloat(it.quantity) > 0)
        );

        if (validInvoices.length === 0) {
            return res.status(400).json({ error: "No valid invoices to generate. Please fill at least one name or item." });
        }

        const templateHtml = fs.readFileSync(path.join(__dirname, 'templates/invoice.html'), 'utf8');
        const template = handlebars.compile(templateHtml);

        const preparedInvoices = validInvoices.map(inv => ({
            ...inv,
            gstin: "37AMEPV3389H1ZG",
            phone: "9553553850"
        }));

        const html = template({ invoices: preparedInvoices });

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.contentType('application/pdf');
        res.send(pdf);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
