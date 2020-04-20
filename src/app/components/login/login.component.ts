import { Component, OnInit, NgModule, TemplateRef } from '@angular/core';
import { UserService } from 'src/app/services/user-service/user.service';
import { User } from 'src/app/models/user';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth-service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})


/*
*  Name: Chris Rodgers/Stephen Orgill		Timestamp: 4/20/20 9:28 am
*  Description: This class validates username and password on attempted login.
*  If login is successful, name and userid are set in session storage.
*/

export class LoginComponent implements OnInit {

	/**
	 * Creates an array of Users
	 * Creates an array of all Users
	 * Sets a chosen user object
	 * Sets name string variable to the chosen user
	 * Sets pagination
	 */

	users: User[] = [];
	allUsers: User[] = [];

	chosenUser: User;
	chosenUserFullName: string = '';
	userName: string = '';
	passWord: string = '';
	totalPage: number = 1;
	curPage: number = 1;

	showDropDown: boolean = false;
	banned: boolean = false;

	pwdError: string;
	usernameError: string;
	userNotFound: string;
	modalRef: BsModalRef;
	httpResponseError: string;
	/**
	 * This is a constructor
	 * @param userService An user service is instantiated.
	 * @param router A router service is injected.
	 * @param http A HTTP Client is created.
	 * @param authService An auth service is injected.
	 *
	 */
	constructor(private modalService: BsModalService, private userService: UserService, private http: HttpClient,
		private authService: AuthService, public router: Router) { }

	/**
	 * When the component is initialized, the system checks for the session storage to validate. Once validated,
	 * the user service is called to retrieve all users.
	 */
	ngOnInit() {
		this.userService.getAllUsers()
			.subscribe(allUsers => {
				this.allUsers = allUsers;
				this.totalPage = Math.ceil(this.allUsers.length / 5);
				this.users = this.allUsers.slice(0, 5);
			});
	}

	/**
	 * A function that allows the user to choose an account to log in as
	 * @param user given
	 */

	changeUser(user) {
		this.showDropDown = false;
		this.curPage = 1;
		this.totalPage = Math.ceil(this.allUsers.length / 5);
		this.users = this.allUsers.slice(this.curPage * 5 - 5, this.curPage * 5);
		this.chosenUserFullName = `${user.firstName} ${user.lastName}: ${user.driver ? 'Driver' : 'Rider'}`;
		this.chosenUser = user;
	}

	/**
	 * A GET method the fetches all the users
	 */

	searchAccount() {
		this.showDropDown = true;
		if (this.chosenUserFullName.length) {
			this.users = this.allUsers.filter(user => {
				return (
					user.firstName.toLowerCase().startsWith(this.chosenUserFullName.toLowerCase()) ||
					user.lastName.toLowerCase().startsWith(this.chosenUserFullName.toLowerCase()) ||
					`${user.firstName} ${user.lastName}`.toLowerCase().startsWith(this.chosenUserFullName.toLowerCase()) ||
					`${user.firstName} ${user.lastName}: ${user.isDriver ? 'Driver' : 'Rider'}`.toLowerCase()
						.startsWith(this.chosenUserFullName.toLowerCase())
				);
			});
			this.totalPage = Math.ceil(this.users.length / 5);
		} else {
			this.curPage = 1;
			this.totalPage = Math.ceil(this.allUsers.length / 5);
			this.users = this.allUsers.slice(this.curPage * 5 - 5, this.curPage * 5);
		}
	}

	/**
	 * A toggle function
	 */

	toggleDropDown() {
		this.showDropDown = !this.showDropDown;
	}

	/**
	 * Set next page
	 */
	nextPage() {
		this.curPage++;
		this.users = this.allUsers.slice(this.curPage * 5 - 5, this.curPage * 5);
	}

	/**
	 * Set prev page
	 */

	prevPage() {
		this.curPage--;
		this.users = this.allUsers.slice(this.curPage * 5 - 5, this.curPage * 5);
	}


	loginBanned() {
		this.userName = '';
		this.banned = true;
	}

	/*
	*  Name: Rodgers/Orgill		Timestamp: 4/20/20 9:36 am
	*  Description: Triggers reveal of login modal on click of login button.
	*  Returns void.
	*/
	openModal(template: TemplateRef<any>) {
		this.modalRef = this.modalService.show(template);
	}

	/*
	*  Name: Rodgers/Orgill		Timestamp: 4/20/20 9:39 am
	*  Description: Submits username and password for validation. Sets name and userid on success.
	*  Returns void.
	*/
	login() {
		// Set error messages to empty
		this.pwdError = '';
		this.usernameError = '';
		this.userNotFound = '';
		this.httpResponseError = '';
		const passValidation = this.validateFields();
		if (passValidation) {

			this.http.get(`${environment.loginUri}?userName=${this.userName}&passWord=${this.passWord}`)
				.subscribe(
					(response) => {
						if (response['passWord'] != undefined) {
							this.pwdError = response['pwdError'][0];
						}
						if ((response['name'] != undefined) && (response['userid'] != undefined)) {
							sessionStorage.setItem('name', response['name']);
							sessionStorage.setItem('userid', response['userid']);

							location.replace('landingPage');
						}
						if (response['userNotFound'] != undefined) {
							this.userNotFound = response['userNotFound'][0];
						}
					},
					(error) => {
						// this.log.error(error); [previous logging functionality]
						this.httpResponseError = 'Cannot login at this time. Please try again later.';
					}
				);
		}
	}


	/*
	*  Name: Rodgers/Orgill		Timestamp: 4/20/20 9:42 am
	*  Description: Checks each login field for completeness. Currently only checks username.
	*  Returns boolean: True if no errors; false if error exists.
	*/
	validateFields() {
		let i = 0;
		if (this.userName === '') {
			this.usernameError = 'Username field required';
			i = 1;
		}

		// can add in validation for password here

		if (i === 1) {
			return false;
		}
		return true;
	}


/*
*  Name: Rodgers/Orgill		Timestamp: 4/20/20 9:43 am
*  Description: Linked to HTML. Executes login() upon pressing enter.
*  Returns void.
*/
	// Submit on Enter
	submitOnEnter(pressEvent) {
		if (pressEvent.keyCode === 13) {
			pressEvent.preventDefault();
			this.login();
		}
	}


}
