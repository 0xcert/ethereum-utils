const Claimable = artifacts.require('Claimable');
const assertRevert = require('../helpers/assertRevert');

contract('ownership/Claimable', (accounts) => {
  let claimable;
  const owner = accounts[0];
  const newOwner = accounts[1];

  beforeEach(async () => {
    claimable = await Claimable.new();
  });

  it('has a pending owner after transferOwnership', async () => {
    await claimable.transferOwnership(newOwner, {from: owner});
    const actualPendingOwner = await claimable.pendingOwner();
    assert.isTrue(actualPendingOwner === newOwner);
    const actualOwner = await claimable.owner();
    assert.isTrue(actualOwner === owner);
  });

  it('resets a pending owner', async () => {
    const firstOwner = accounts[2];
    const secodndOwner = accounts[3];
    await claimable.transferOwnership(firstOwner, {from: owner});
    let actualPendingOwner = await claimable.pendingOwner();
    assert.isTrue(actualPendingOwner === firstOwner);

    await claimable.transferOwnership(secodndOwner, {from: owner});
    actualPendingOwner = await claimable.pendingOwner();
    assert.isTrue(actualPendingOwner === secodndOwner);
  });

  it('prevents non-owners from transfering', async () => {
    const other = accounts[2];
    const actualOwner = await claimable.owner.call();
    assert.isTrue(actualOwner !== other);
    await assertRevert(claimable.transferOwnership(other, { from: other }));
  });

  it('claims pending ownership and re-sets pending ownership to 0', async () => {
    await claimable.transferOwnership(newOwner, {from: owner});
    await claimable.claimOwnership({from: newOwner});

    const actualOwner = await claimable.owner();
    const actualPendingOwner = await claimable.pendingOwner();
    assert.isTrue(actualOwner === newOwner);
    assert.isTrue(actualPendingOwner === '0x0000000000000000000000000000000000000000');
  });

  it('emits OwnershipTransferred after successful claim', async () => {
    await claimable.transferOwnership(newOwner, {from: owner});
    const { logs } = await claimable.claimOwnership({from: newOwner});
    const event = logs.find(e => e.event === 'OwnershipTransferred');
    assert.notEqual(event, undefined);
  });

  it('prevents non-approved accounts from claimng', async () => {
    const other = accounts[2];
    await claimable.transferOwnership(newOwner, {from: owner});
    await assertRevert(claimable.claimOwnership({from: other}));
  });

});
