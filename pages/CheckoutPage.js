import { expect } from '@playwright/test';

class CheckoutPage {
    constructor(page){
        this.page = page;
        this.titleLbl = page.locator("//span[@class='title']");
        this.firstNameTxt = page.getByPlaceholder("First Name");
        this.lastNameTxt = page.getByPlaceholder("Last Name");
        this.zipCodeTxt = page.getByPlaceholder("Zip/Postal Code");
        this.continueBtn = page.getByRole('button',{name:'continue'});
        }

    async verifyTitle(){
        await expect(this.titleLbl)
            .toHaveText("Checkout: Your Information");
    }

    async fillForm(firstName,lastName,postalCode){
        await this.firstNameTxt.fill(firstName);
        await this.lastNameTxt.fill(lastName);
        await this.zipCodeTxt.fill(postalCode);
    }

    async continueToPay(){
        await this.continueBtn.click();
    }

}
export {CheckoutPage}