import {
  acceptance,
  exists,
  publishToMessageBus,
  query,
  queryAll,
} from "discourse/tests/helpers/qunit-helpers";
import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import TopicFixtures from "discourse/tests/fixtures/topic";

acceptance("Topic - User Status", function (needs) {
  const status = { emoji: "tooth", description: "off to dentist" };

  needs.user();
  needs.pretender((server, helper) => {
    server.get("/t/299/1.json", () => {
      const response = TopicFixtures["/t/299/1.json"];
      response.post_stream.posts.forEach((post) => {
        post.user_status = status;
      });

      return helper.response(200, response);
    });
  });

  test("shows user status next to avatar on posts", async function (assert) {
    this.siteSettings.enable_user_status = true;
    await visit("/t/-/299/1");

    assert.equal(
      queryAll(".topic-post .user-status-message").length,
      3,
      "all posts has user status"
    );
  });
});

acceptance("Topic - User Status - live updates", function (needs) {
  const userId = 1;

  needs.user();
  needs.pretender((server, helper) => {
    server.get("/t/299/1.json", () => {
      const response = TopicFixtures["/t/299/1.json"];
      response.post_stream.posts.forEach((post) => {
        post.user_id = userId;
        post.user_status = { emoji: "tooth", description: "off to dentist" };
      });

      return helper.response(200, response);
    });
  });

  test("updating status", async function (assert) {
    this.siteSettings.enable_user_status = true;

    await visit("/t/-/299/1");
    assert.equal(
      queryAll(".topic-post .user-status-message").length,
      3,
      "all posts has user status"
    );
    assert.ok(
      query(".topic-post .user-status-message .emoji").src.includes(
        status.emoji
      ),
      "status emoji is correct"
    );

    const newStatus = { emoji: "surfing_man", description: "surfing" };
    await publishToMessageBus(`/user-status`, { [userId]: newStatus });

    assert.equal(
      queryAll(".topic-post .user-status-message").length,
      3,
      "all posts has user status"
    );
    assert.ok(
      query(".topic-post .user-status-message .emoji").src.includes(
        newStatus.emoji
      ),
      "status emoji is correct"
    );
  });

  test("removing status and setting again", async function (assert) {
    this.siteSettings.enable_user_status = true;

    await visit("/t/-/299/1");
    assert.equal(
      queryAll(".topic-post .user-status-message").length,
      3,
      "all posts has user status"
    );
    assert.ok(
      query(".topic-post .user-status-message .emoji").src.includes(
        status.emoji
      ),
      "status emoji is correct"
    );

    await publishToMessageBus(`/user-status`, { [userId]: null });

    assert.notOk(
      exists(".topic-post .user-status-message"),
      "status on all posts has disappeared"
    );

    const newStatus = { emoji: "surfing_man", description: "surfing" };
    await publishToMessageBus(`/user-status`, { [userId]: newStatus });

    assert.equal(
      queryAll(".topic-post .user-status-message").length,
      3,
      "all posts has user status"
    );
    assert.ok(
      query(".topic-post .user-status-message .emoji").src.includes(
        newStatus.emoji
      ),
      "status emoji is correct"
    );
  });
});
