import { expect } from '@playwright/test';

class LoginPage {
    constructor(page){
        this.page=page;
        this.userNameTxt=page.getByPlaceholder("Username");
        this.passwordTxt=page.getByPlaceholder("Password");
        this.loginBtn=page.getByText("Login");
    }

    async login(username,password){
        await this.userNameTxt.fill(username);
        await this.passwordTxt.fill(password);
        await this.loginBtn.click();
    }

    async verifyLoginPage(){
        await expect(this.loginBtn).toBeVisible();
    }


}
export { LoginPage };
