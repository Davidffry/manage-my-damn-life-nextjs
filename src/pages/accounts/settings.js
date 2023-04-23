import AppBarGeneric from "@/components/common/AppBarGeneric";
import { Loading } from "@/components/common/Loading";
import { displayErrorMessageFromAPIResponse, getI18nObject } from "@/helpers/frontend/general";
import Head from "next/head";
import { Col, Container, ProgressBar, Row } from "react-bootstrap";
import Placeholder from 'react-bootstrap/Placeholder';
const { withRouter } = require("next/router");
const { Component } = require("react");
import Card from 'react-bootstrap/Card';
import { getAuthenticationHeadersforUser } from "@/helpers/frontend/user";
import { isValidResultArray, varNotEmpty } from "@/helpers/general";
import { BACKGROUND_GRAY } from "@/config/style";
import moment from "moment";
import { caldavAccountsfromServer } from "@/helpers/frontend/calendar";
import { Form } from "react-bootstrap";
import { toast } from "react-toastify";
import ManageUsers from "@/components/admin/ManageUsers";
class Settings extends Component {

    constructor(props) {
        super(props)
        this.i18next = getI18nObject()
        this.state = { userInfo: <Loading centered={true} padding={30} /> , calendarOptions:[], calendarsFromServer :[], defaultCalendar:'', allowReg: 1, userManager: null}
        this.getUserInfo = this.getUserInfo.bind(this)
        this.getCalendarName = this.getCalendarName.bind(this)
        this.getAllUserSettings = this.getAllUserSettings.bind(this)
        this.renderAdminSettings = this.renderAdminSettings.bind(this)
        this.calendarSelected = this.calendarSelected.bind(this)
        this.getCalendarOutput = this.getCalendarOutput.bind(this)
        this.allowRegChanged = this.allowRegChanged.bind(this)
    }
    componentDidMount() {
        this.getUserInfo()
        this.getCalendarName()
        this.getAllUserSettings()
    }
    async getAllUserSettings(){
        const url_api = process.env.NEXT_PUBLIC_API_URL + "settings/get"

        const authorisationData = await getAuthenticationHeadersforUser()

        const requestOptions =
        {
            method: 'GET',
            headers: new Headers({ 'authorization': authorisationData }),
        }

        fetch(url_api, requestOptions)
            .then(response => response.json())
            .then((body) => {
                if(varNotEmpty(body) && varNotEmpty(body.success) && body.success==true)
                {
                    if(varNotEmpty(body.data.message.user) && Array.isArray(body.data.message.user))
                    {
                        for(const i in body.data.message.user)
                        {
                            if(body.data.message.user[i]["name"]=="DEFAULT_CALENDAR")
                            {
                                this.setState({defaultCalendar: body.data.message.user[i]["value"]})
                            }
                        }

                    }

                    if(varNotEmpty(body.data.message.admin))
                    {
                        for(const i in body.data.message.admin)
                        {
                            if(body.data.message.admin[i]["name"]=="GLOBAL_DISABLE_USER_REGISTRATION")
                            {
                                var allowReg = 1
                                if(varNotEmpty(body.data.message.admin[i]["value"]) && (body.data.message.admin[i]["value"]==1 ||  body.data.message.admin[i]["value"]=="1" || body.data.message.admin[i]["value"]==true || body.data.message.admin[i]["value"]=="true"   ))
                                {
                                    allowReg=0
                                }
                                this.setState({allowReg: allowReg})
                            }
                        }
                    }

                }else{
                    console.log(body)
                    toast.error(this.state.i18next.t("ERROR_GETTING_SETTINGS"))
                    
                }
            })

    }
    async getUserInfo() {
        const url_api = process.env.NEXT_PUBLIC_API_URL + "users/info"

        const authorisationData = await getAuthenticationHeadersforUser()

        const requestOptions =
        {
            method: 'GET',
            headers: new Headers({ 'authorization': authorisationData }),
        }

        fetch(url_api, requestOptions)
            .then(response => response.json())
            .then((body) => {
                if (varNotEmpty(body)) {
                    if (varNotEmpty(body.success) && body.success == true) {

                        var isAdminOutput = body.data.message.level=="1" ? (   
                        <Row>
                            <Col xs={3}>
                                <b>{this.i18next.t("ADMIN")}</b>
                            </Col>
                            <Col xs={9}>
                                {this.i18next.t("YES")}
                            </Col>
                        </Row>
                        ):null

                        var isAdmin = body.data.message.level=="1" ? true: false
                      
                        var userInfo = (
                            <div style={{padding: 20, background: BACKGROUND_GRAY}}>
                                <Row>
                                    <Col xs={3}>
                                        <b>{this.i18next.t("USERNAME")}</b>
                                    </Col>
                                    <Col xs={9}>
                                        {body.data.message.username}
                                    </Col>
                                </Row>
                                <Row>
                                    <Col Col xs={3}>
                                        <b>{this.i18next.t("EMAIL")}</b>
                                    </Col>
                                    <Col xs={9}>
                                        {body.data.message.email}
                                    </Col>
                                </Row>
                                <Row>
                                    <Col Col xs={3}>
                                        <b>{this.i18next.t("CREATED_ON")}</b>
                                    </Col>
                                    <Col xs={9}>
                                        {moment.unix(body.data.message.created).toString()}
                                    </Col>
                                </Row>
                                {isAdminOutput}

                            </div>
                        )
                            this.setState({userInfo: userInfo, isAdmin: isAdmin })
                    } else {
                        displayErrorMessageFromAPIResponse(body)
                    }
                }
                else {
                    toast.error(this.state.i18next.t("ERROR_GENERIC"))

                }


            });


     
    }

    async getCalendarName(){
        var calendarsFromServer = await caldavAccountsfromServer()
        this.setState({calendarsFromServer: calendarsFromServer})

    }
    async generateCalendarList() {
    }
    async calendarSelected(e)
    {

        this.setState({defaultCalendar: e.target.value })
        if(varNotEmpty(e.target.value) && e.target.value!="")
        {
            this.updateDefaultCalendaronServer(e.target.value)
        }

    }
    async updateDefaultCalendaronServer(calendar_id)
    {
        const authorisationData = await getAuthenticationHeadersforUser()

        //Make change settings request.
        const url_api = process.env.NEXT_PUBLIC_API_URL + "settings/modify"
        const requestOptions =
        {
            method: 'POST',
            body: JSON.stringify({ "name": "DEFAULT_CALENDAR", "value": calendar_id}),
            mode: 'cors',
            headers: new Headers({ 'authorization': authorisationData, 'Content-Type': 'application/json' }),
        }
        try {
        fetch(url_api, requestOptions)
                .then(response =>  response.json())
                .then((body) => {
                    if(varNotEmpty(body) && varNotEmpty(body.success) && body.success==true)
                    {
                        toast.success(this.i18next.t("UPDATE_OK"))
                    }else{
                        toast.success(this.i18next.t("ERROR_GENERIC"))
                        console.log("Setting update response:")
                        console.log(body)
    

                    }
                    this.getAllUserSettings()

                });
        }
        catch (e) {
            toast.error(e.message)
        }

    }
    allowRegChanged(e)
    {
        this.setState({allowReg: e.target.value})
        this.postAllowRegChanges(e.target.value)

    }
    async postAllowRegChanges(allowReg)
    {
        if(allowReg==1)
        {
            allowReg=0
        }else{
            allowReg=1
        }
        const authorisationData = await getAuthenticationHeadersforUser()

        
        //Make change settings request.
        const url_api = process.env.NEXT_PUBLIC_API_URL + "settings/modify"
        const requestOptions =
        {
            method: 'POST',
            body: JSON.stringify({ "name": "GLOBAL_DISABLE_USER_REGISTRATION", "value": allowReg}),
            mode: 'cors',
            headers: new Headers({ 'authorization': authorisationData, 'Content-Type': 'application/json' }),
        }
        try {
        fetch(url_api, requestOptions)
                .then(response =>  response.json())
                .then((body) => {
                    if(varNotEmpty(body) && varNotEmpty(body.success) && body.success==true)
                    {
                        toast.success(this.i18next.t("UPDATE_OK"))
                    }else{
                        toast.success(this.i18next.t("ERROR_GENERIC"))
                        console.log("Setting update response GLOBAL_DISABLE_USER_REGISTRATION:")                
                        console.log(body)
    

                    }

                });
        }
        catch (e) {
            toast.error(e.message)
        }


    }
    renderAdminSettings(){

        var disabled=false
        if(varNotEmpty(process.env.NEXT_PUBLIC_DISABLE_USER_REGISTRATION) && (process.env.NEXT_PUBLIC_DISABLE_USER_REGISTRATION==true || process.env.NEXT_PUBLIC_DISABLE_USER_REGISTRATION=="true" ))
        {
            disabled=true
        }
        var disabledMessage = null
        if(disabled)
        {
            disabledMessage=(<p style={{color: "red", textAlign: "center"}}>{this.i18next.t('USER_REG_DISABLED_FROM_ENV')}</p>)
        }
        return(
            <>
            <h2>{this.i18next.t("ADMIN")+ " "+this.i18next.t("SETTINGS")}</h2>
            <br />
            <Row style={{display: "flex", alignItems: "center"}}>
                <Col xs={3}>
                    {this.i18next.t("ALLOW_REGISTRATION")}
                </Col>
                <Col xs={9}>
                <Form.Select onChange={this.allowRegChanged} disabled={disabled} value={this.state.allowReg} size="sm">
                    <option value={0}>{this.i18next.t("NO")}</option>
                    <option value={1}>{this.i18next.t("YES")}</option>
                </Form.Select>
                </Col>
            </Row>
            {disabledMessage}
            <br />
            <ManageUsers />
            </>
        )

    }
    getCalendarOutput()
    {
        var calendarsFromServer = this.state.calendarsFromServer
        var calendarOutput = null
        if (isValidResultArray(calendarsFromServer)) {
            calendarOutput = []
            calendarOutput.push(<option key="calendar-select-empty" ></option>)
            for (let i = 0; i < calendarsFromServer.length; i++) {
                var tempOutput = []

                for (let j = 0; j < calendarsFromServer[i].calendars.length; j++) {
                    var value = calendarsFromServer[i].calendars[j].calendars_id
                    var key = j + "." + value
                    tempOutput.push(<option key={key} style={{ background: calendarsFromServer[i].calendars[j].calendarColor }} value={value}>{calendarsFromServer[i].calendars[j].displayName}</option>)
                }
                calendarOutput.push(<optgroup key={calendarsFromServer[i].account.name} label={calendarsFromServer[i].account.name}>{tempOutput}</optgroup>)

            }

            return (<Form.Select key="calendarOptions" onChange={this.calendarSelected} value={this.state.defaultCalendar}  >{calendarOutput}</Form.Select>) 

        }

    }
    render() {

        var adminTable = this.state.isAdmin? this.renderAdminSettings(): null
        return (
            <>
                <Head>
                    <title>{this.i18next.t("APP_NAME_TITLE") + " - " + this.i18next.t("SETTINGS")}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <AppBarGeneric />
                <Container fluid>
                    <div style={{ padding: 20 }}>
                        <h1>{this.i18next.t("SETTINGS")}</h1>
                        <br />
                        <h2>{this.i18next.t("ACCOUNT_INFO")}</h2>
                        {this.state.userInfo}
                        <br />
                        <Row style={{display: "flex", alignItems: "center"}}>
                            <Col  xs={3}>
                                {this.i18next.t("DEFAULT")+ " "+this.i18next.t("CALENDAR")}
                            </Col>
                            <Col  xs={9}>
                                {this.getCalendarOutput()}
                            </Col>
                        </Row>
                        <br />
                        {adminTable}
                        <br />
                        {this.state.userManager}
                    </div>

                </Container>
            </>
        )
    }

}


export default withRouter(Settings)