import React from 'react';
import PropTypes from 'prop-types';
import Navbar from './Navbar.jsx';
import Discussion from './Discussion.jsx';
import Start from './Start.jsx';
import Comment from './Comment.jsx';

class MainPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sessionId: null,
            session: null
        };

        this.fetchSession = this.fetchSession.bind(this);
    }

    async fetchSession(id) {
        const response = await fetch('/api/session/fetch', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await response.json();

        if (data.success) {this.setState({ session: data.session });}
    }

    async componentDidMount() {
        if (!localStorage.getItem('session')) return;
        await this.fetchSession(localStorage.getItem('session'));
    }

    render() {
        let body;
        if (this.state.session !== null) {body = <Discussion />;}
        else {body = <Start inputFunc={this.fetchSession} />;}

        return (
            <main>
                <Navbar />
                {body}
                <Comment username='user01' upvotes={0} downvotes={0} text='Hey this is a comment!' date={new Date()} />
            </main>
        );
    }
}

MainPage.propTypes = { id: PropTypes.number };

export default MainPage;
