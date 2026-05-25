import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly userNameTxt: Locator;
    readonly passwordTxt: Locator;
    readonly loginBtn: Locator;

    constructor(page: Page){
        this.page=page;
        this.userNameTxt=page.getByPlaceholder("Username");
        this.passwordTxt=page.getByPlaceholder("Password");
        this.loginBtn=page.getByText("Login");
    }

    async login(username: string,password: string){
        await this.userNameTxt.fill(username);
        await this.passwordTxt.fill(password);
        await this.loginBtn.click();
    }

    async verifyLoginPage(){
        await expect(this.loginBtn).toBeVisible();
    }


}