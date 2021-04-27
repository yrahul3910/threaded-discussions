import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import Comment from './Comment.jsx';
import ToastManager from 'js-notifications';

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
        const toastManager = new ToastManager();
        if (!resp.success) {
            toastManager.notify({
                className: 'toast--fail',
                title: 'Reply failed.',
                content: 'Failed to submit reply'
            });
        }
        else {
            toastManager.notify({
                className: 'toast--success',
                title: 'Reply success',
                content: 'Your comment has been posted.'
            });
        }

        this.props.refreshFunc();
    }

    render() {
        const body = this.props.comments.map(
            (x, i) => <Comment key={i}
                id={x.id}
                refreshFunc={this.props.refreshFunc}
                username={x.username}
                upvotes={x.upvotes}
                text={x.text}
                date={new Date(x.date)}
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
