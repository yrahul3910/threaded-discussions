import React from 'react';
import PropTypes from 'prop-types';
import Navbar from './Navbar.jsx';
import Discussion from './Discussion.jsx';
import Start from './Start.jsx';
import Footer from './Footer.jsx';
import UsernameGenerator from 'username-generator';

class MainPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sessionId: null,
            session: null,
            refresh: false
        };

        this.fetchSession = this.fetchSession.bind(this);
        this.createSession = this.createSession.bind(this);
        this.refreshFunc = this.refreshFunc.bind(this);
    }

    async refreshFunc() {
        await this.fetchSession(localStorage.getItem('session'), 'token', localStorage.getItem('token'));
    }

    async createSession(title, pwd) {
        const response = await fetch('/api/session/create', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                pwd
            })
        });
        const data = await response.json();

        if (data.response.success) {
            localStorage.setItem('session', data.response.id);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', UsernameGenerator.generateUsername('-'));
            this.setState({
                sessionId: data.response.id,
                pwd
            });
        }
    }

    async fetchSession(id, authMode, pwd) {
        const response = await fetch('/api/session/fetch', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                authMode,
                pwd
            })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem('session', id);
            localStorage.setItem('user', UsernameGenerator.generateUsername('-'));
            localStorage.setItem('token', data.token);
            this.setState({ session: data });
        }
    }

    async componentDidMount() {
        if (!localStorage.getItem('session')) return;

        await this.fetchSession(localStorage.getItem('session'), 'token', localStorage.getItem('token'));
    }

    render() {
        let body;

        if (this.state.session !== null) {
            body = <Discussion
                title={this.state.session.meta.title}
                comments={this.state.session.comments}
                refreshFunc={this.refreshFunc} />;
        }
        else {body = <Start createFunc={this.createSession} inputFunc={this.fetchSession} />;}


        return (
            <main>
                <div>
                    <Navbar />
                    {body}
                </div>
                <Footer />
            </main>
        );
    }
}

MainPage.propTypes = { id: PropTypes.number };

export default MainPage;
