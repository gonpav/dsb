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
	constructor(id, name, vyklykId, faceitName, locale = 'en-US', status = ChallengerStatus.Pending, declineReason = null) {
        super(id, name);
        this.vyklykId = vyklykId;
        this.faceitName = faceitName;
        this.status = status;
        this.locale = locale;
        this.declineReason = declineReason;
	}
}

module.exports = {
	Challenge,
    Challenger,
    ChallengeStatus,
    ChallengerStatus,
};
