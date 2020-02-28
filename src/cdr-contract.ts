/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Call, CallStatus } from './call';
import { CallEvents } from './events'
import { createHash as hash } from "crypto";

@Info({title: 'CdrContract', description: 'My Smart Contract' })
export class Cdr extends Contract {

    @Transaction()
    public async CreateCallStart(
        ctx: Context, 
        senderOperator: string, 
        callerId: string, 
        callReceiverId: string, 
        startedAt: string) {
            // get transaction sender CN
            const transactionSender = ctx.clientIdentity.getX509Certificate().subject.commonName

            // Create a Call object
            let call = new Call()
            call = {
                receiverOperator: transactionSender,
                senderOperator,
                callerId,
                callReceiverId,
                startedAt,
                endedAt: null,
                duration: 0,
                status: CallStatus.StartCreated
            }
            const callId = this.getHash(call)
            const callBuffer = Buffer.from(JSON.stringify(call));

            // Put new state
            await ctx.stub.putState(callId, callBuffer)

            // raise event
            const eventBuffer = Buffer.from(JSON.stringify({ callId, ...call }))
            ctx.stub.setEvent(CallEvents.callStartCreated, eventBuffer)

            // return useful values
            return { callId, status: call.status }
    }

    @Transaction()
    public async AcceptCallStart(ctx: Context, callId: string) {
        // get transaction sender CN
        const transactionSender = ctx.clientIdentity.getX509Certificate().subject.commonName

        // get state by callId
        const callBuffer = await ctx.stub.getState(callId)
        let call = JSON.parse(callBuffer.toString()) as Call
        if (!call) throw new Error('Invalid call id')

        // check call sender is equal to transaction sender
        if (call.senderOperator !== transactionSender) throw new Error('Permission denied to accept call start')

        // check if call start has been created before
        if (call.status !== CallStatus.StartCreated) throw new Error('Call Start cannot be accepted')

        // Put new state
        call.status = CallStatus.StartAccepted
        const newCallBuffer = Buffer.from(JSON.stringify(call));
        await ctx.stub.putState(callId, newCallBuffer)

        // raise event
        const eventBuffer = Buffer.from(JSON.stringify({ callId }))
        ctx.stub.setEvent(CallEvents.callStartAccepted, eventBuffer)

        // return useful values
        return { callId, status: call.status }
    }

    @Transaction()
    public async endCall(ctx: Context, callId: string) {
        // get state by callId
        const callBuffer = await ctx.stub.getState(callId)
        let call = JSON.parse(callBuffer.toString()) as Call
        if (!call) throw new Error('Invalid call id')

        // check if call has been accepted before
        if (call.status !== CallStatus.StartAccepted) throw new Error('Call cannot be Ended')
        
        // update call object
        call.endedAt = this.getTxTimestamp(ctx)
        call.duration = +call.endedAt - +call.startedAt
        call.status = CallStatus.Ended
        const newCallBuffer = Buffer.from(JSON.stringify(call));
        await ctx.stub.putState(callId, newCallBuffer)

        // raise event
        const eventBuffer = Buffer.from(JSON.stringify({ callId, endedAt: call.endedAt, duration: call.duration }))
        ctx.stub.setEvent(CallEvents.callEnded, eventBuffer)

        // return useful values
        return { callId, status: call.status }
    }

    // Private Methods
    private getHash(data) {
        return hash("SHA256")
            .update(JSON.stringify(data))
            .digest("hex")
            .substring(0, 7);
    }

    private getTxTimestamp(ctx: Context): string {
        const timestamp = ctx.stub.getTxTimestamp()
        return (timestamp.getSeconds() * 1000 + timestamp.getNanos() / 1000000).toString()
    }
    

}
