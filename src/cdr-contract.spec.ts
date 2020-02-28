/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { CdrContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logging = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
     };
}

describe('CdrContract', () => {

    let contract: CdrContract;
    let ctx: TestContext;

    beforeEach(() => {
        contract = new CdrContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"cdr 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"cdr 1002 value"}'));
    });

    describe('#cdrExists', () => {

        it('should return true for a cdr', async () => {
            await contract.cdrExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a cdr that does not exist', async () => {
            await contract.cdrExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createCdr', () => {

        it('should create a cdr', async () => {
            await contract.createCdr(ctx, '1003', 'cdr 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"cdr 1003 value"}'));
        });

        it('should throw an error for a cdr that already exists', async () => {
            await contract.createCdr(ctx, '1001', 'myvalue').should.be.rejectedWith(/The cdr 1001 already exists/);
        });

    });

    describe('#readCdr', () => {

        it('should return a cdr', async () => {
            await contract.readCdr(ctx, '1001').should.eventually.deep.equal({ value: 'cdr 1001 value' });
        });

        it('should throw an error for a cdr that does not exist', async () => {
            await contract.readCdr(ctx, '1003').should.be.rejectedWith(/The cdr 1003 does not exist/);
        });

    });

    describe('#updateCdr', () => {

        it('should update a cdr', async () => {
            await contract.updateCdr(ctx, '1001', 'cdr 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"cdr 1001 new value"}'));
        });

        it('should throw an error for a cdr that does not exist', async () => {
            await contract.updateCdr(ctx, '1003', 'cdr 1003 new value').should.be.rejectedWith(/The cdr 1003 does not exist/);
        });

    });

    describe('#deleteCdr', () => {

        it('should delete a cdr', async () => {
            await contract.deleteCdr(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a cdr that does not exist', async () => {
            await contract.deleteCdr(ctx, '1003').should.be.rejectedWith(/The cdr 1003 does not exist/);
        });

    });

});
