const ChallengeStatus = Object.freeze({
    Draft: 'Draft',
    Published: 'Published',
    Unpublished: 'Unpublished',
    Deleted: 'Deleted',
  });


const ChallengerStatus = Object.freeze({
    Pending: 'Pending',
    Approved: 'Approved',
    Declined: 'Declined',
  });


class Challenge {
	constructor(id) {
		this.id = id;
        this.status = ChallengeStatus.Draft;
	}
}

class User {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}
}

class Challenger extends User {
	constructor(id, name) {
        super(id, name);
        this.vyklykId = null;
        this.faceitNickname = null;
        this.status = ChallengerStatus.Pending;
	}
}

module.exports = {
	Challenge,
    Challenger,
    ChallengeStatus,
    ChallengerStatus,
};
