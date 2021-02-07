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

        if (data.success) {this.setState({ session: data });}
    }

    async componentDidMount() {
        /*
         * If (!localStorage.getItem('session')) return;
         *await this.fetchSession(localStorage.getItem('session'));
         */
        await this.fetchSession(5);
    }

    render() {
        // Let body;
        /*
         *If (this.state.session !== null) {body = <Discussion />;}
         *else {body = <Start inputFunc={this.fetchSession} />;}
         */

        const body = this.state.session ?
            this.state.session.comments.map((x, i) => <Comment key={i} username={x.username} upvotes={x.upvotes}
                downvotes={x.downvotes} text={x.text} date={x.date} replies={x.replies} />) :
            <div></div>;

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
