import { expect } from '@playwright/test';

class InformationPage{
    constructor(page)
    {
        this.page=page;
        this.titleLbl=page.locator("//span[@class='title']");
        this.listofItems=page.locator("//div[@class='cart_list']");
        this.finishBtn=page.getByRole('button',{name:'finish'});

    }
    //confirm we are in the cart page by checking the title
    async verifyTitle(){
        await expect(this.titleLbl)
        .toHaveText("Checkout: Overview");
    }
    //confirm the products in the cart are the same as the products we added to the cart by checking the name and price of the products
    async verifyProducts(itemsList,pricesList){
        const itemsNames = await this.listofItems.locator("//div[@class='inventory_item_name']").allTextContents();
        const itemsPrices = await this.listofItems.locator("//div[@class='inventory_item_price']").allTextContents();

        for (let i=0;i<itemsNames.length;i++){
            await expect(itemsList).toContain(itemsNames[i]);
            await expect(pricesList).toContain(itemsPrices[i]);
        }
    }

    async finish(){
        await this.finishBtn.click();
    }

}

export {InformationPage};