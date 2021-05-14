import supertest from 'supertest';
import { expect } from 'chai';

const server = supertest.agent('http://localhost:8000/');

describe('Creating a new session', () => {
    it('test', done => {
        server
            .get('/')
            .expect(200)
            .expect('Content-Type', /html/)
            .end((e, res) => {
                expect(res.status).to.equal(200);
                done();
            });
    });

    it('Should reject empty fields', done => {
        server
            .post('api/session/create')
            .send({})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) done(err);

                expect(res.status).to.equal(200);
                expect(res.body.success).to.equal(false);

                done();
            });
    });
});

describe('fetching sessions', () => {
    it('should fetch a session', done => {
        server
            .post('api/session/fetch')
            .send({ id: 'yx3cia' })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) done(err);

                expect(res.body.success).to.equal(true);
                expect(res.body.comments).to.be.of.length(0);

                done();
            });
    });
});
