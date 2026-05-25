import {Page,Locator, expect} from '@playwright/test';

export class CartPage{
    readonly page: Page;
    readonly listofItems: Locator;
    readonly checkoutBtn: Locator;
    constructor(page: Page)
    {
        this.page=page;
        this.listofItems=page.locator("//div[@class='cart_contents_container']");
        this.checkoutBtn=page.getByRole('button',{name:'checkout'});
    }

    //confirm the products in the cart are the same as the products we added to the cart by checking the name and price of the products
    async verifyProducts(itemsList: string[], pricesList: string[]){
        const itemsNames = await this.listofItems.locator("//div[@class='inventory_item_name']").allTextContents();
        const itemsPrices = await this.listofItems.locator("//div[@class='inventory_item_price']").allTextContents();

        for (let i=0;i<itemsNames.length;i++){
            await expect(itemsList).toContain(itemsNames[i]);
            await expect(pricesList).toContain(itemsPrices[i]);
        }
    }

    async checkout(){
        await this.checkoutBtn.click();
    }

}
