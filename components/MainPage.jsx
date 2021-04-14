import React from 'react';
import PropTypes from 'prop-types';
import Navbar from './Navbar.jsx';
import Discussion from './Discussion.jsx';
import Start from './Start.jsx';
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
        await this.fetchSession(localStorage.getItem('session'));
    }

    async createSession(title) {
        const response = await fetch('/api/session/create', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem('session', data.id);
            localStorage.setItem('user', UsernameGenerator.generateUsername('-'));
            this.setState({ sessionId: data.id });
        }
    }

    async fetchSession(id) {
        const response = await fetch('/api/session/fetch', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem('session', id);
            localStorage.setItem('user', UsernameGenerator.generateUsername('-'));
            this.setState({ session: data });
        }
    }

    async componentDidMount() {
        if (!localStorage.getItem('session')) return;

        await this.fetchSession(localStorage.getItem('session'));
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
                <Navbar />
                {body}

            </main>
        );
    }
}

MainPage.propTypes = { id: PropTypes.number };

export default MainPage;
