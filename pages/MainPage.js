import { test, expect } from '@playwright/test';

class MainPage{
    constructor(page){
        this.page = page;
        this.itemList = page.locator("//div[@class='inventory_item']");
        this.shoppingCartIcn = page.locator("//a[@class='shopping_cart_link']");
        this.menuBtn = page.locator("//button[@id='react-burger-menu-btn']");
        this.logoutBtn = page.locator("//a[@id='logout_sidebar_link']");
    }

    async SelectItem(itemName){
        //check if the badge with the number of items in the cart is present, if it is get the number of items in the cart
        let currentCartItems=0;
        const badgeLocator = this.shoppingCartIcn
            .locator("//span[@class='shopping_cart_badge']");
        
        const badgeCount = await badgeLocator.count();

        if (badgeCount > 0){
            currentCartItems = await this.shoppingCartIcn
            .locator("//span[@class='shopping_cart_badge']")
            .innerText()
            .then(Number);
        }            

        //click on the button "Add to cart" for the item
        console.log(itemName);    
        await this.itemList
            .filter({hasText:itemName})
            .getByRole('button')
            .click();

        const price = await this.itemList
            .filter({hasText:itemName})
            .locator("//div[@class='inventory_item_price']")
            .innerText();


        //confirm the item is added to the cart by checking the number of items in the cart and the button text
        await expect(this.shoppingCartIcn
            .locator("//span[@class='shopping_cart_badge']"))
            .toHaveText(String(currentCartItems+1));

        await expect(this.itemList
            .filter({hasText:itemName})
            .getByRole('button'))
            .toBeVisible();
            
        return { itemName, price };
    }
    
    async goToCart(){
        await this.shoppingCartIcn.click();
    }

    async logout(){
        await this.menuBtn.click();
        await this.logoutBtn.click();
    }

}
export {MainPage};