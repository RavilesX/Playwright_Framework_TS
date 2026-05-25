import { Page, Locator, expect } from '@playwright/test';

export class MainPage{
    readonly page: Page;
    readonly itemList: Locator;
    readonly shoppingCartIcn: Locator;
    readonly menuBtn: Locator;
    readonly logoutBtn: Locator;

    constructor(page: Page){
        this.page = page;
        this.itemList = page.locator("//div[@class='inventory_item']");
        this.shoppingCartIcn = page.locator("//a[@class='shopping_cart_link']");
        this.menuBtn = page.locator("//button[@id='react-burger-menu-btn']");
        this.logoutBtn = page.locator("//a[@id='logout_sidebar_link']");
    }

    async SelectItem(itemName: string){
        //check if the badge with the number of items in the cart is present, if it is get the number of items in the cart
        let currentCartItems: number = 0;
        const badgeLocator: Locator = this.shoppingCartIcn
            .locator("//span[@class='shopping_cart_badge']");
        
        const badgeCount: number = await badgeLocator.count();

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

        const price: string = await this.itemList
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
            
        return { itemName, price } ;
    }
    
    async goToCart(){
        await this.shoppingCartIcn.click();
    }

    async logout(){
        await this.menuBtn.click();
        await this.logoutBtn.click();
    }

}