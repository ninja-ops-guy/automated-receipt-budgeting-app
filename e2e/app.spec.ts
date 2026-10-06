import {test,expect} from './health';
test('purchases, attached receipts, deletion and budgets persist',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'Add purchase'}).click();
 const modal=page.getByRole('dialog',{name:'Add a purchase'});
 await modal.getByLabel('Merchant',{exact:true}).fill('Test Corner Market');await modal.getByLabel('Amount',{exact:false}).fill('42.75');
 await modal.locator('input[type=file]').setInputFiles({name:'receipt.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=','base64')});
 await modal.getByRole('button',{name:'Save purchase'}).click();await expect(modal).toBeHidden();
 await page.getByRole('button',{name:'Transactions',exact:true}).click();await page.getByLabel('Search purchases').fill('Test Corner Market');
 await expect(page.getByText('Test Corner Market',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Receipt',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('receipt.png');
 await page.getByRole('button',{name:'Close dialog'}).click();
 await page.reload();await page.getByRole('button',{name:'Transactions',exact:true}).click();await page.getByLabel('Search purchases').fill('Test Corner Market');
 await expect(page.getByText('Test Corner Market',{exact:true})).toBeVisible();
 page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete Test Corner Market'}).click();await expect(page.getByText('Test Corner Market',{exact:true})).toBeHidden();
 await page.getByRole('button',{name:'Budgets',exact:true}).click();await page.getByRole('button',{name:'Edit limits'}).click();
 await page.getByLabel('Monthly limit for Groceries').fill('777');await page.getByRole('button',{name:'Save limits'}).click();await expect(page.getByText('Monthly limits updated.')).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'Budgets',exact:true}).click();await page.getByRole('button',{name:'Edit limits'}).click();await expect(page.getByLabel('Monthly limit for Groceries')).toHaveValue('777');
});
test('sample sync is idempotent and mobile workspace renders',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'Sync sample inbox'}).click();await expect(page.getByText('2 purchase confirmations captured.')).toBeVisible();
 await page.getByRole('button',{name:'Sync sample inbox'}).click();await expect(page.getByText('All caught up — no new sample confirmations.')).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('sample inbox connection can be added, persisted and removed',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'Connect inbox'}).click();await page.getByLabel('Email address').fill('test@example.com');await page.getByRole('button',{name:'Add preview inbox'}).click();await expect(page.getByRole('dialog')).toBeHidden();
 await page.reload();await page.getByRole('button',{name:'Connections & plan',exact:true}).click();await expect(page.getByText('test@example.com',{exact:true})).toBeVisible();
 page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Remove test@example.com'}).click();await expect(page.getByText('test@example.com',{exact:true})).toBeHidden();
});
