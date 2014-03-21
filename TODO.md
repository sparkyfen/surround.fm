TODO
----


* Create a backend that allow for users to stream their last.fm data in real time to other users around them.

* User uses application and when they open it and accept the agreements, they create an account and link it with their Last.FM account.

* Use Last.FM API to retrieve updates.

* Show list of users around the user that are listening to music.
    * Username, song name, artist, time
    * Possibly add a buy option

* Find a way to figure out if they are listening to music at the time a user requests people around them.

* If user owns the song, they can tune in with the other person around them. Song starts at the same time.

* Possibly alert user when other people are listening to the same song they are.

* Add friends and see what they are listening to (Use last.fm friends?)

API
---

* Register
* Login
* Send signal
* Retrieve proximity users
* Link Last.fm
* Change password
* Add friends
* Delete friends
* Search

* Reduce the amount of data that gets sent back for each query.

* Fix issue with modal not being displayed in production.
    * https://github.com/angular-ui/bootstrap/issues/1947
    * https://github.com/DaftMonk/generator-angular-fullstack/issues/135

* Fix animation not occuring for alerts with ng-animate