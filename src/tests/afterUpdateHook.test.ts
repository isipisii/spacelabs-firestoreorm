import { FirestoreRepository } from "../core/FirestoreRepository.js";

// mock Firestore classes and methods
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({
	get: mockGet,
	set: mockSet,
}));
const mockCollection = jest.fn(() => ({
	doc: mockDoc,
}));

jest.mock("firebase-admin/firestore", () => ({
	Firestore: jest.fn().mockImplementation(() => ({
		collection: mockCollection,
	})),
}));

describe("FirestoreRepository update() id behavior (mocked Firestore)", () => {
	let userRepo: FirestoreRepository<{ id?: string; name: string }>;

	beforeEach(() => {
		const db = new (require("firebase-admin/firestore").Firestore)();
		userRepo = new FirestoreRepository<{ id?: string; name: string }>(db, "test_users_id_behavior");
	});

	it("should return updated document including id", async () => {
		const fakeId = "user123";
		const fakeData = { name: "Original Name" };

		// mock Firestore get() to return existing data
		mockGet.mockResolvedValueOnce({
			exists: true,
			data: () => fakeData,
		});

		mockSet.mockResolvedValueOnce(undefined);

		const updated = await userRepo.update(fakeId, { name: "Updated Name" });

		expect(updated.id).toBe(fakeId);
		expect(updated.name).toBe("Updated Name");
	});

	it("should pass id to afterUpdate hook", async () => {
		const hookSpy = jest.fn();
		(userRepo as any).hooks = { afterUpdate: [hookSpy] };

		const fakeId = "user456";
		const fakeData = { name: "Original" };

		mockGet.mockResolvedValueOnce({ exists: true, data: () => fakeData });
		mockSet.mockResolvedValueOnce(undefined);

		await userRepo.update(fakeId, { name: "Hook Updated" });

		expect(hookSpy).toHaveBeenCalledTimes(1);
		const hookPayload = hookSpy.mock.calls[0][0];
		expect(hookPayload.id).toBe(fakeId);
		expect(hookPayload.name).toBe("Hook Updated");
	});
});
