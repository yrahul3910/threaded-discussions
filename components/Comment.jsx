import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import ToastManager from 'js-notifications';

class Comment extends React.Component {
    constructor(props) {
        super(props);

        this.parent = React.createRef();
        this.collapseBtn = React.createRef();
        this.replyBtn = React.createRef();
        this.text = React.createRef();
        this.reply = React.createRef();

        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.openReply = this.openReply.bind(this);
        this.submitReply = this.submitReply.bind(this);
    }

    async submitReply() {
        const text = this.reply.current.value;

        const req = await fetch('/api/session/comment', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: localStorage.getItem('session'),
                comment: text,
                user: localStorage.getItem('user'),
                responseTo: this.props.id
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
        this.toggleCollapsed();
    }

    toggleCollapsed() {
        this.parent.current.classList.toggle('collapsed');

        if (this.collapseBtn.current.innerHTML === '[-]') {this.collapseBtn.current.innerHTML = '[+]';}
        else {this.collapseBtn.current.innerHTML = '[-]';}
    }

    openReply() {
        console.log('Hello');
        const el = this.text.current;
        if (el.classList.contains('collapsed')) {el.classList.remove('collapsed');}
    }

    render() {
        const child = this.props.replies.map((x, i) => <Comment key={i}
            id={x.id}
            refreshFunc={this.props.refreshFunc}
            username={x.username}
            upvotes={x.upvotes}
            downvotes={x.downvotes}
            text={x.text}
            date={x.date}
            replies={x.replies} />

        );

        return (
            <Fragment>
                <div ref={this.parent} className={`comment ${ this.props.id}`}>
                    <div className='comment-header'>
                        <span onClick={this.toggleCollapsed} ref={this.collapseBtn}>[-]</span>
                        <span className='comment-user'>
                            {this.props.username}
                        </span>
                        <span className='votes'>
                            {this.props.downvotes ?
                                this.props.upvotes - this.props.downvotes :
                                this.props.upvotes}
                        </span>
                        <span className='date'>
                            {moment(this.props.date).fromNow()}
                        </span>
                    </div>
                    <p className='comment-text'>{this.props.text}</p>
                    <div className='comment-footer'>
                        <i className='fas fa-arrow-up'></i>
                        <i className='fas fa-arrow-down'></i>
                        <a ref={this.replyBtn} onClick={this.openReply}>
                            <i className='fas fa-reply'></i>
                        </a>
                    </div>
                    <div className='comment-reply collapsed' ref={this.text}>
                        <textarea ref={this.reply}
                            placeholder='Type your reply here. Please be nice, and follow community standards!' />
                        <button className='reply-button' onClick={this.submitReply}>submit</button>
                    </div>
                    {child}
                </div>
            </Fragment>
        );
    }
}

Comment.propTypes = {
    text: PropTypes.string.isRequired,
    id: PropTypes.string,
    refreshFunc: PropTypes.func.isRequired,
    upvotes: PropTypes.number.isRequired,
    downvotes: PropTypes.number,
    username: PropTypes.string.isRequired,
    date: PropTypes.instanceOf(Date),
    replies: PropTypes.array.isRequired
};

export default Comment;
