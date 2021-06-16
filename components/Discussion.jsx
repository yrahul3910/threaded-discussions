import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Comment from './Comment.jsx';
import Toastify from 'toastify-js';

class Discussion extends React.Component {
    constructor(props) {
        super(props);

        this.replyField = React.createRef();
        this.submitReply = this.submitReply.bind(this);
    }

    async submitReply() {
        const text = this.replyField.current.value;

        const req = await fetch('/api/session/comment', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: localStorage.getItem('session'),
                comment: text,
                user: localStorage.getItem('user'),
                responseTo: null
            })
        });
        const resp = await req.json();
        if (!resp.success) {
            Toastify({
                text: 'Failed to submit reply.',
                duration: 3000,
                gravity: 'bottom',
                position: 'right',
                backgroundColor: 'rgb(204, 0, 0)',
                color: 'white'
            }).showToast();
        }
        else {
            Toastify({
                text: 'Reply added.',
                duration: 3000,
                gravity: 'bottom',
                position: 'right',
                backgroundColor: 'rgb(0, 204, 0)',
                color: 'white'
            }).showToast();
        }

        this.props.refreshFunc();
    }

    render() {
        const body = this.props.comments.map(
            (x, i) => <Comment key={i}
                id={x.id}
                refreshFunc={this.props.refreshFunc}
                username={x.username}
                text={x.text}
                date={x.date}
                replies={x.replies} />);

        return (
            <Fragment>
                <h1 style={{ padding: '20px' }}>{this.props.title}</h1>
                <h3 style={{
                    color: 'grey',
                    paddingLeft: '20px'
                }}>{localStorage.getItem('session')}</h3>
                {body}
                <div className='comment-reply'>
                    <textarea ref={this.replyField}
                        placeholder='Type your reply here. Please be nice, and follow community standards!' />
                    <button onClick={this.submitReply} className='reply-button'>submit</button>
                </div>
            </Fragment>
        );
    }
}

Discussion.propTypes = {
    title: PropTypes.string.isRequired,
    comments: PropTypes.array.isRequired,
    refreshFunc: PropTypes.func.isRequired
};

export default Discussion;
