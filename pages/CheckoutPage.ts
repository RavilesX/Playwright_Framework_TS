import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
    readonly page: Page;
    readonly firstNameTxt: Locator;
    readonly lastNameTxt: Locator;
    readonly zipCodeTxt: Locator;
    readonly continueBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.firstNameTxt = page.getByPlaceholder("First Name");
        this.lastNameTxt = page.getByPlaceholder("Last Name");
        this.zipCodeTxt = page.getByPlaceholder("Zip/Postal Code");
        this.continueBtn = page.getByRole('button',{name:'continue'});
        }

    async fillForm(firstName: string, lastName: string, postalCode: string){
        await this.firstNameTxt.fill(firstName);
        await this.lastNameTxt.fill(lastName);
        await this.zipCodeTxt.fill(postalCode);
    }

    async continueToPay(){
        await this.continueBtn.click();
    }

}