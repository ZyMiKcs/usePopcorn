import { useEffect, useRef, useState } from 'react';
import StarRating from './StarRating';
import { useMovies } from './useMovies';
import { useLocalStorageState } from './useLocalStorageState';
import { useKey } from './useKey';

const average = (arr) =>
    arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = 'ed9dcdfb';

export default function App() {
    const [query, setQuery] = useState('');
    const [selectedMovieId, setSelectedMovieId] = useState(null);
    const { movies, isLoading, error } = useMovies(query);
    const [watched, setWatched] = useLocalStorageState([], 'watched');

    function handleSelectMovieId(id) {
        setSelectedMovieId((selectedMovieId) =>
            id === selectedMovieId ? null : id
        );
    }

    function handleCloseMovie() {
        setSelectedMovieId(null);
    }

    function handleAddWatched(movie) {
        setWatched((watched) => [...watched, movie]);

        // localStorage.setItem('watched', JSON.stringify([...watched, movie]));
    }

    function handleDeleteWatched(id) {
        setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
    }

    return (
        <>
            <NavBar>
                <Search query={query} setQuery={setQuery} />
                <NumResults movies={movies} />
            </NavBar>

            <Main>
                <Box>
                    {isLoading ? (
                        <Loader />
                    ) : error ? (
                        <ErrorMessage message={error} />
                    ) : (
                        <MovieList
                            movies={movies}
                            onSelect={handleSelectMovieId}
                        />
                    )}
                </Box>

                <Box>
                    {selectedMovieId ? (
                        <MovieDetails
                            selectedMovieId={selectedMovieId}
                            onCloseMovie={handleCloseMovie}
                            onAddWatched={handleAddWatched}
                            watched={watched}
                        />
                    ) : (
                        <>
                            <WatchedSummary watched={watched} />
                            <WatchedMoviesList
                                watched={watched}
                                onDeleteWatched={handleDeleteWatched}
                            />
                        </>
                    )}
                </Box>
            </Main>
        </>
    );
}

function Loader() {
    return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
    return <p className="error">{message}</p>;
}

function NavBar({ children }) {
    return (
        <nav className="nav-bar">
            <Logo />
            {children}
        </nav>
    );
}

function NumResults({ movies }) {
    return (
        <p className="num-results">
            Found <strong>{movies.length}</strong> results
        </p>
    );
}

function Logo() {
    return (
        <div className="logo">
            <span role="img">🍿</span>
            <h1>usePopcorn</h1>
        </div>
    );
}

function Search({ query, setQuery }) {
    const inputEl = useRef(null);

    useKey('Enter', function () {
        if (document.activeElement === inputEl.current) return;
        inputEl.current.focus();
        setQuery('');
    });

    // useEffect(
    //     function () {
    //         function callback(e) {
    //             if (e.code === 'Enter') {
    //                 if (document.activeElement === inputEl.current) return;
    //                 inputEl.current.focus();
    //                 setQuery('');
    //             }
    //         }

    //         document.addEventListener('keydown', callback);

    //         return () => document.addEventListener('keydown', callback);
    //     },
    //     [setQuery]
    // );

    return (
        <input
            className="search"
            type="text"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={inputEl}
        />
    );
}

function Main({ children }) {
    return <main className="main">{children}</main>;
}

function Box({ children }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="box">
            <button
                className="btn-toggle"
                onClick={() => setIsOpen((open) => !open)}
            >
                {isOpen ? '–' : '+'}
            </button>

            {isOpen && children}
        </div>
    );
}

function MovieList({ movies, onSelect }) {
    return (
        <ul className="list list-movies">
            {movies?.map((movie) => (
                <Movie movie={movie} key={movie.imdbID} onSelect={onSelect} />
            ))}
        </ul>
    );
}

function Movie({ movie, onSelect }) {
    return (
        <li onClick={() => onSelect(movie.imdbID)}>
            <img src={movie.Poster} alt={`${movie.Title} poster`} />
            <h3>{movie.Title}</h3>
            <div>
                <p>
                    <span>🗓</span>
                    <span>{movie.Year}</span>
                </p>
            </div>
        </li>
    );
}

function MovieDetails({
    selectedMovieId,
    onCloseMovie,
    onAddWatched,
    watched,
}) {
    const [movie, setMovie] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [userRating, setUserRating] = useState('');

    const countRef = useRef(0);

    useEffect(
        function () {
            if (userRating) countRef.current++;
        },
        [userRating]
    );

    const isWatched = watched
        .map((movie) => movie.imdbID)
        .includes(selectedMovieId);

    const watchedUserRating = watched.find(
        (movie) => movie.imdbID === selectedMovieId
    )?.userRating;

    const {
        Title: title,
        Year: year,
        Poster: poster,
        Runtime: runtime,
        imdbRating,
        Plot: plot,
        Released: released,
        Actors: actors,
        Director: director,
        Genre: genre,
    } = movie;

    function handleAdd() {
        const newWatchedMovie = {
            imdbID: selectedMovieId,
            imdbRating: Number(imdbRating),
            title,
            year,
            poster,
            runtime: Number(runtime.split(' ').at(0)),
            userRating,
            countRatingDecisions: countRef.current,
        };

        onAddWatched(newWatchedMovie);
        onCloseMovie();
    }

    useEffect(
        function () {
            setIsLoading(true);
            async function getMovieDetails() {
                const res = await fetch(
                    `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedMovieId}`
                );

                const data = await res.json();
                setMovie(data);
                setIsLoading(false);
            }
            getMovieDetails();
        },
        [selectedMovieId]
    );

    useEffect(
        function () {
            if (!title) return;
            document.title = `Movie | ${title}`;

            return function () {
                document.title = 'usePopcorn ';
            };
        },
        [title]
    );

    useKey('Escape', onCloseMovie);

    return (
        <div className="details">
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <header>
                        <button className="btn-back" onClick={onCloseMovie}>
                            &larr;
                        </button>
                        <img src={poster} alt={`Poster of ${title} movie `} />
                        <div className="details-overview">
                            <h2>{title}</h2>
                            <p>
                                {released} &bull; {runtime}
                            </p>
                            <p>{genre}</p>
                            <p>
                                <span>⭐</span>
                                {imdbRating} IMDb rating
                            </p>
                        </div>
                    </header>

                    <section>
                        <div className="rating">
                            {!isWatched ? (
                                <>
                                    <StarRating
                                        maxRating={10}
                                        size={24}
                                        onSetRating={setUserRating}
                                    />
                                    {userRating > 0 && (
                                        <button
                                            className="btn-add"
                                            onClick={handleAdd}
                                        >
                                            + Add to list
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>
                                    You rated this movie {watchedUserRating}
                                    <span> ⭐️</span>
                                </p>
                            )}
                        </div>
                        <p>
                            <em>{plot}</em>
                        </p>
                        <p>Starring {actors}</p>
                        <p>Directed by {director}</p>
                    </section>
                </>
            )}
        </div>
    );
}

function WatchedSummary({ watched }) {
    const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
    const avgUserRating = average(watched.map((movie) => movie.userRating));
    const avgRuntime = average(watched.map((movie) => movie.runtime));

    return (
        <div className="summary">
            <h2>Movies you watched</h2>
            <div>
                <p>
                    <span>#️⃣</span>
                    <span>{watched.length} movies</span>
                </p>
                <p>
                    <span>⭐️</span>
                    <span>{avgImdbRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{avgUserRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{avgRuntime} min</span>
                </p>
            </div>
        </div>
    );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
    return (
        <ul className="list">
            {watched.map((movie) => (
                <WatchedMovie
                    movie={movie}
                    key={movie.imdbID}
                    onDeleteWatched={onDeleteWatched}
                />
            ))}
        </ul>
    );
}

function WatchedMovie({ movie, onDeleteWatched }) {
    return (
        <li>
            <img src={movie.poster} alt={`${movie.title} poster`} />
            <h3>{movie.title}</h3>

            <div>
                <p>
                    <span>⭐️</span>
                    <span>{movie.imdbRating}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{movie.userRating}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{movie.runtime} min</span>
                </p>
            </div>
            <button
                className="btn-delete"
                onClick={() => onDeleteWatched(movie.imdbID)}
            >
                X
            </button>
        </li>
    );
}
