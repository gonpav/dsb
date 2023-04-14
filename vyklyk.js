const ChallengeStatus = Object.freeze({
    Draft: 'Draft',
    Published: 'Published',
    Unpublished: 'Unpublished',
    // Deleted: 'Deleted',
  });


const ChallengerStatus = Object.freeze({
    Pending: 'Pending',
    Approved: 'Approved',
    Declined: 'Declined',
  });


class Challenge {
	constructor(id, status = ChallengeStatus.Draft) {
		this.id = id;
        this.status = status;
	}
}

class User {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}
}

class Challenger extends User {
	constructor(id, name, vyklykId = null, faceitName = null, status = ChallengerStatus.Pending) {
        super(id, name);
        this.vyklykId = vyklykId;
        this.faceitName = faceitName;
        this.status = status;
	}
}

module.exports = {
	Challenge,
    Challenger,
    ChallengeStatus,
    ChallengerStatus,
};
