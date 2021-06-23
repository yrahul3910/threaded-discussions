import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Toastify from 'toastify-js';
import marked from 'marked';

class Comment extends React.Component {
    constructor(props) {
        super(props);

        this.parent = React.createRef();
        this.collapseBtn = React.createRef();
        this.replyBtn = React.createRef();
        this.text = React.createRef();
        this.reply = React.createRef();
        this.upvoteBtn = React.createRef();
        this.downvoteBtn = React.createRef();

        this.state = {
            userVote: 0,
            votes: 0
        };

        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.openReply = this.openReply.bind(this);
        this.submitReply = this.submitReply.bind(this);
        this.sendVote = this.sendVote.bind(this);
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

        this.reply.current.value = '';
    }

    async componentDidMount() {
        const req = await fetch('/api/comment/votes', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId: this.props.id })
        });

        const res = await req.json();
        this.setState({ votes: res.upvotes - res.downvotes });
    }

    toggleCollapsed() {
        this.parent.current.classList.toggle('collapsed');

        if (this.collapseBtn.current.innerHTML === '[-]') {this.collapseBtn.current.innerHTML = '[+]';}
        else {this.collapseBtn.current.innerHTML = '[-]';}
    }

    openReply() {
        const el = this.text.current;
        if (el.classList.contains('collapsed')) {el.classList.remove('collapsed');}
    }

    async sendVote(vote) {
        // In case we need to revert
        const previousState = this.state.userVote;

        // First, update the state
        this.setState({
            vote: this.state.userVote === vote ?
                0 :
                vote
        });

        // Next, send a request
        const req = await fetch('/api/comment/vote', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vote,
                commentId: this.props.id,
                userId: localStorage.getItem('user')
            })
        });
        const res = await req.json();

        if (!res.success) {
            this.setState({ vote: previousState });
        }
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
                            {this.state.votes}
                        </span>
                        <span className='date'>
                            {moment(this.props.date).fromNow()}
                        </span>
                    </div>
                    <p className='comment-text' dangerouslySetInnerHTML={marked(this.props.text)}></p>
                    <div className='comment-footer'>
                        <i onClick={() => {this.sendVote(1);}}
                            ref={this.upvoteBtn}
                            className='fas fa-arrow-up'></i>
                        <i onClick={() => {this.sendVote(-1);}}
                            ref={this.downvoteBtn}
                            className='fas fa-arrow-down'></i>
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
    id: PropTypes.string.isRequired,
    refreshFunc: PropTypes.func.isRequired,
    username: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    replies: PropTypes.array.isRequired
};

export default Comment;
