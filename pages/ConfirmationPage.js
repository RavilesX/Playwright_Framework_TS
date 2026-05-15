import { expect } from '@playwright/test';

class ConfirmationPage {
    constructor(page){
        this.page=page;
        this.confirmationMsgLbl = page.locator("//h2[@class='complete-header']");
        this.backHomeBtn = page.locator("//button[@id='back-to-products']");
}

    async orderConfirmation(){
        await expect(this.confirmationMsgLbl).toHaveText("Thank you for your order!");
    }

    async backToMainPage(){
        await this.backHomeBtn.click();
    }


}
export { ConfirmationPage };